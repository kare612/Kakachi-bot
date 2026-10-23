const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

// مصفوفة لتخزين الأوامر المحملة ديناميكياً
const commands = new Map()

// دالة تحميل الأوامر من مجلد الإضافات تلقائياً
function loadCommands() {
    const pluginsDir = path.join(__dirname, 'plugins')
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir)

    const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'))
    for (const file of files) {
        try {
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

    // 2. إعدادات البوت الأساسية
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // تعطيل الـ QR كود نهائياً
        auth: state,
        connectTimeoutMs: 60000, // زيادة وقت انتظار استجابة السيرفر لفك الحظر
        defaultQueryTimeoutMs: 0
    })

    // 3. طلب كود الربط النصي (Pairing Code) تلقائياً إذا لم تكن هناك جلسة مسجلة
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925" 
        
        console.log('⏳ جاري تهيئة الاتصال والانتظار لفك حظر الخادم المؤقت (10 ثوانٍ)...')
        await delay(10000) // انتظار 10 ثوانٍ كاملة لتجنب الخطأ 428 وتأمين الاتصال
        
        try {
            // طلب الكود من خوادم واتساب
            let code = await sock.requestPairingCode(phoneNumber)
            code = code?.match(/.{1,4}/g)?.join('-') || code
            
            console.log('\n======================================')
            console.log(`🔥 كود ربط بوت كاكاشي الخاص بك هو: [ ${code} ]`)
            console.log('======================================\n')
            console.log('👉 افتح واتساب > الأجهزة المرتبطة > ربط جهاز > ربط باستخدام رقم الهاتف واكتب الكود أعلاه.')
        } catch (error) {
            console.error('\n❌ فشل في طلب كود الربط بسبب قيود الخادم المتكررة.')
            console.error('💡 الحل: يرجى تفعيل وضع الطيران في هاتفك لمدة 10 ثوانٍ لتغيير الـ IP ثم أعد المحاولة.\n')
        }
    }

    // حفظ التغييرات في الجلسة تلقائياً
    sock.ev.on('creds.update', saveCreds)

    // مراقبة حالة الاتصال وإعادة التوصيل التلقائي عند انقطاع السيرفر
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('🔄 تم إغلاق الاتصال، جاري إعادة الاتصال... ', shouldReconnect)
            if (shouldReconnect) {
                await delay(5000) // انتظار 5 ثوانٍ قبل محاولة إعادة الاتصال لحماية الحساب
                startKakashiBot()
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
            if (m.key.fromMe) return // تجاهل رسائل البوت نفسه

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
                
