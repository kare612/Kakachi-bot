const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay, Browsers } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

// 🟢 ضع رقم هاتفك هنا مسبوقاً برمز الدولة بدون علامة + (مثال للمغرب: 2126XXXXXXXX)
const phoneNumber = "212784776925"

// مصفوفة لتخزين الأوامر المحملة ديناميكياً
const commands = new Map()

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
    // 1. تحديد مجلد حفظ الجلسة
    const { state, saveCreds } = await useMultiFileAuthState('session')

    // تحميل الأوامر عند بدء التشغيل
    loadCommands()

    // 2. إعدادات البوت الأساسية (تمت إضافة تعريف المتصفح لمنع حظر الاتصال)
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
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

    // معالجة الرسائل الواردة وتمريرها للمجلد المستهدف
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const m = chatUpdate.messages[0]
            if (!m || !m.message) return
            if (m.key.fromMe) return

            const remoteJid = m.key.remoteJid
            const messageContent = m.message.conversation || m.message.extendedTextMessage?.text || ''
            
            // تحديد رمز الأمر الافتراضي المعتمد للبوت (البادئة)
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
                
