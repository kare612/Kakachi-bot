const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const readline = require('readline')

// إعداد مدخلات اللوحة لقراءة الكود إذا لزم الأمر
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function startKakashiBot() {
    // 1. تحديد مجلد حفظ الجلسة
    const { state, saveCreds } = await useMultiFileAuthState('session')

    // 2. إعدادات البوت الأساسية
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // تعطيل الـ QR كود نهائياً
        auth: state
    })

    // 3. طلب كود الربط النصي (Pairing Code) تلقائياً إذا لم تكن هناك جلسة مسجلة
    if (!sock.authState.creds.registered) {
        // رقم هاتفك بدون علامة + ومع رمز الدولة
        const phoneNumber = "212784776925" 
        
        await delay(3000) // انتظار تهيئة السيرفر ثواني معدودة
        try {
            // طلب الكود من خوادم واتساب
            let code = await sock.requestPairingCode(phoneNumber)
            code = code?.match(/.{1,4}/g)?.join('-') || code
            
            console.log('\n======================================')
            console.log(`🔥 كود ربط بوت كاكاشي الخاص بك هو: [ ${code} ]`)
            console.log('======================================\n')
            console.log('👉 افتح واتساب > الأجهزة المرتبطة > ربط جهاز > ربط باستخدام رقم الهاتف واكتب الكود أعلاه.')
        } catch (error) {
            console.error('فشل في طلب كود الربط، تأكد من الرقم:', error)
        }
    }

    // حفظ التغييرات في الجلسة تلقائياً
    sock.ev.on('creds.update', saveCreds)

    // مراقبة حالة الاتصال
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('تم إغلاق الاتصال، جاري إعادة الاتصال... ', shouldReconnect)
            if (shouldReconnect) {
                startKakashiBot()
            }
        } else if (connection === 'open') {
            console.log('✅ بنجاح! بوت كاكاشي متصل برقمك وشغال الآن.')
        }
    })

    sock.ev.on('messages.upsert', async m => {
        // هنا معالجة رسائل وأوامر البوت
    })
}

startKakashiBot()
                
