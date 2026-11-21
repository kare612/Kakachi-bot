const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

// رقم هاتف البوت
const phoneNumber = "212784776925"

// أرقام ومعرفات المطور المستثناة من الحظر والحماية
const OWNER_IDS = ['212715469251', '68531186057376']

const commands = new Map()
global.antiLinkGroups = global.antiLinkGroups || {}
global.antiContactGroups = global.antiContactGroups || {}
global.botMode = global.botMode || 'public'

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
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const { version } = await fetchLatestBaileysVersion()
    let pairingRequested = false

    loadCommands()

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        syncFullHistory: false,
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 15000
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'connecting' && !sock.authState.creds.registered && !pairingRequested) {
            pairingRequested = true
            setTimeout(async () => {
                try {
                    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
                    let code = await sock.requestPairingCode(cleanNumber)
                    code = code?.match(/.{1,4}/g)?.join('-') || code

                    console.log('\n======================================')
                    console.log(`🔥 كود ربط بوت كاكاشي الخاص بك هو: [ ${code} ]`)
                    console.log('======================================\n')
                    console.log('👉 افتح واتساب > الأجهزة المرتبطة > ربط جهاز > ربط باستخدام رقم الهاتف واكتب الكود أعلاه.')
                } catch (error) {
                    pairingRequested = false
                    console.error('\n❌ تعذر طلب الكود حالياً:', error.message)
                }
            }, 3000)
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const reason = lastDisconnect?.error?.message || 'غير معروف'
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut
            console.log(`🔄 تم إغلاق الاتصال (الرمز: ${statusCode} - ${reason})، إعادة المحاولة بعد 8 ثوانٍ...`)

            if (shouldReconnect) {
                await delay(8000)
                startKakashiBot()
            } else {
                console.log('⚠️ تم تسجيل الخروج! احذف مجلد session وأعد التشغيل.')
            }
        } else if (connection === 'open') {
            console.log('✅ بنجاح! بوت كاكاشي متصل برقمك وشغال الآن.')
        }
    })

    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const m = chatUpdate.messages.at(0)
            if (!m || !m.message) return
            if (m.key.fromMe) return

            const remoteJid = m.key.remoteJid
            const isGroup = remoteJid.endsWith('@g.us')
            const sender = m.key.participant || m.key.participantAlt || remoteJid
            const isOwner = OWNER_IDS.some(id => sender.includes(id))

            const messageContent = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''

            // 🛡️ حماية المجموعات: منع جهات الاتصال والأرقام والروابط
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
                            text: `${reasonText}\n👤 @${sender.split('@').at(0)}`,
                            mentions: [sender]
                        })
                        await sock.groupParticipantsUpdate(remoteJid, [sender], 'remove')
                        return
                    }
                }
            }

            if (global.botMode === 'private' && !isOwner) return

            const prefix = '.'
            if (!messageContent.startsWith(prefix)) return

            const args = messageContent.slice(prefix.length).trim().split(/ +/)
            const commandName = args.shift().toLowerCase()

            const command = commands.get(commandName)
            if (command) {
                await command.execute(sock, m, args, remoteJid)
            }
        } catch (err) {
            console.error('خطأ في معالجة الرسالة الواردة:', err)
        }
    })
}

startKakashiBot()
                    
