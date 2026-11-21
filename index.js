const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

// رقم هاتف البوت
const phoneNumber = "212784776925"

// أرقام ومعرفات المطور المستثناة من الحظر والحماية
const OWNER_IDS = ['212715469251', '68531186057376']

// مصفوفة لتخزين الأوامر المحملة ديناميكياً
const commands = new Map()

// تهيئة إعدادات الحماية والوضع العام
global.antiLinkGroups = global.antiLinkGroups || {}
global.antiContactGroups = global.antiContactGroups || {}
global.botMode = global.botMode || 'public'

// دالة تحميل الأوامر من مجلد الإضافات تلقائياً
function loadCommands() {
    commands.clear()
    const pluginsDir = path.join(__dirname, 'plugins')
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir)

    const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'))
    for (const file of files) {
        try {
            delete require.cache[require.resolve(path.join(pluginsDir, file))]
            const command = require(path.join(pluginsDir, file))
            if (command.name && command.execute) {
                commands.set(command.name, command)
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => commands.set(alias, command))
                }
            }
        } catch (error) {
            console.error(`❌ خطأ في تحميل ملف الأمر ${file}:`, error)
        }
    }
    console.log(`📊 تم تحميل ${files.length} أمر من مجلد الإضافات بنجاح.`)
}

async function startKakashiBot() {
    // 1. تحديد مجلد حفظ الجلسة وجلب أحدث إصدار بروتوكول واتساب
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const { version } = await fetchLatestBaileysVersion()

    // تحميل الأوامر عند بدء التشغيل
    loadCommands()

    // 2. إعدادات البوت الأساسية
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS('Desktop'),
        auth: state,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: true
    })

    // 3. طلب كود الربط النصي (Pairing Code) تلقائياً إذا لم تكن هناك جلسة مسجلة
    if (!sock.authState.creds.registered) {
        console.log('⏳ جاري تهيئة الاتصال وطلب كود الربط (انتظر 5 ثوانٍ)...')
        await delay(5000)
        
        try {
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
            let code = await sock.requestPairingCode(cleanNumber)
            code = code?.match(/.{1,4}/g)?.join('-') || code
            
            console.log('\n======================================')
            console.log(`🔥 كود ربط بوت كاكاشي الخاص بك هو: [ ${code} ]`)
            console.log('======================================\n')
            console.log('👉 افتح واتساب > الأجهزة المرتبطة > ربط جهاز > ربط باستخدام رقم الهاتف واكتب الكود أعلاه.')
        } catch (error) {
            console.error('\n❌ فشل في طلب كود الربط:', error.message)
            console.error('💡 الحل: تأكد من الرقم، أو فعّل وضع الطيران 10 ثوانٍ ثم أعد التشغيل.\n')
        }
    }

    // حفظ التغييرات في الجلسة تلقائياً
    sock.ev.on('creds.update', saveCreds)

    // مراقبة حالة الاتصال وإعادة التوصيل التلقائي عند انقطاع السيرفر
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error instanceof Boom)?.output?.statusCode
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut
            console.log(`🔄 تم إغلاق الاتصال (السبب: ${statusCode || 'غير معروف'})، جاري إعادة الاتصال...`, shouldReconnect)
            
            if (shouldReconnect) {
                await delay(5000)
                startKakashiBot()
            } else {
                console.log('⚠️ تم تسجيل الخروج! احذف مجلد session وأعد التشغيل لربط رقم جديد.')
            }
        } else if (connection === 'open') {
            console.log('✅ بنجاح! بوت كاكاشي متصل برقمك وشغال الآن.')
        }
    })

    // معالجة الرسائل الواردة والحماية وتمرير الأوامر للمجلد المستهدف
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const m = chatUpdate.messages[0]
            if (!m || !m.message) return
            if (m.key.fromMe) return

            const remoteJid = m.key.remoteJid
            const isGroup = remoteJid.endsWith('@g.us')
            const sender = m.key.participant || m.key.participantAlt || remoteJid
            const isOwner = OWNER_IDS.some(id => sender.includes(id))

            const messageContent = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''

            // 🛡️ أولاً: نظام الحماية الفورية للمجموعات (يعمل على كل الرسائل حتى بدون نقطة)
            if (isGroup && !isOwner) {
                const isContact = Boolean(m.message?.contactMessage || m.message?.contactsArrayMessage)
                const hasPhoneNumber = /(?:\+|00)[1-9][0-9 \-().]{7,18}/.test(messageContent)
                const hasLink = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/[^\s]+)/i.test(messageContent)

                const triggerContact = global.antiContactGroups[remoteJid] && (isContact || hasPhoneNumber)
                const triggerLink = global.antiLinkGroups[remoteJid] && hasLink

                if (triggerContact || triggerLink) {
                    const groupMeta = await sock.groupMetadata(remoteJid)
                    const isAdmin = groupMeta.participants.find(p => p.id === sender)?.admin

                    if (!isAdmin) {
                        await sock.sendMessage(remoteJid, { delete: m.key })
                        const reasonText = triggerContact
                            ? '🚫 *ممنوع إرسال جهات الاتصال أو الأرقام في هذه المجموعة!*'
                            : '🚫 *ممنوع إرسال الروابط في هذه المجموعة!*'

                        await sock.sendMessage(remoteJid, {
                            text: `${reasonText}\n👤 @${sender.split('@')[0]}`,
                            mentions: [sender]
                        })
                        await sock.groupParticipantsUpdate(remoteJid, [sender], 'remove')
                        return
                    }
                }
            }

            // 🔒 ثانياً: التحقق من الوضع الخاص (Private Mode)
            if (global.botMode === 'private' && !isOwner) return

            // ⚡ ثالثاً: معالجة الأوامر التي تبدأ بالبادئة ( . )
            const prefix = '.' 
            if (!messageContent.startsWith(prefix)) return

            const args = messageContent.slice(prefix.length).trim().split(/ +/)
            const commandName = args.shift().toLowerCase()

            // البحث عن الأمر من مجلد الإضافات وتشغيله
            const command = commands.get(commandName)
            if (command) {
                await command.execute(sock, m, args, remoteJid)
            }
        } catch (err) {
            console.error('خطأ في معالجة الرسالة الواردة:', err)
        }
    })
}

// تشغيل البوت
startKakashiBot()
