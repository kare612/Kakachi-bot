const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    Browsers 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const { handleCommand } = require('./commands'); 

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    // استخدام مجلد الجلسة الافتراضي للمستودع
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, 
        logger: pino({ level: 'silent' }), 
        // 🔒 إعدادات متصفح دقيقة لمنع تعليق خوادم الواتساب وتوليد الكود فوراً
        browser: ['Mac OS', 'Chrome', '121.0.0.0'], 
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    // طلب الكود الرقمي إذا لم تكن مسجلاً
    if (!sock.authState.creds.registered) {
        console.clear();
        console.log("\x1b[36m⚡ Kakachi-bot | نظام اقتران الكود الرقمي ⚡\x1b[0m\n");
        
        let phoneNumber = await question('📞 أدخل رقم الهاتف مع رمز الدولة (مثال: 212784776925): ');
        phoneNumber = phoneNumber.replace(/[^0-9]/g, ''); // إزالة أي مسافات أو رموز

        console.log(`\n⏳ يتم الآن جلب الكود من خوادم واتساب.. انتظر قليلًا...`);
        
        // تأخير أمني كافٍ لتهيئة المقبس وضمان توليد الكود
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code; 
                console.log(`\n========================================`);
                console.log(`🔑 كود الربط الرقمي الخاص بك هو: \x1b[32m${code}\x1b[0m`);
                console.log(`========================================\n`);
                console.log(`👉 افتح واتساب > الأجهزة المرتبطة > ربط برقم الهاتف وأدخل الكود الموضح.`);
                rl.close();
            } catch (error) {
                console.error("❌ فشل توليد الكود. تأكد من جودة الإنترنت أو جرب إعادة التشغيل:", error.message);
                rl.close();
            }
        }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);

    // محرك معالجة الرسائل والأوامر
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages;
            if (!msg || !msg.message || msg.key.fromMe) return; 

            const from = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

            console.log(`📩 رسالة واردة من [${from}]: ${text}`);
            await handleCommand(sock, msg, from, text);

        } catch (err) {
            console.error("❌ خطأ في المحرك:", err);
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log('🔄 انقطع الاتصال، جاري إعادة التشغيل التلقائي...');
                startBot(); 
            } else {
                console.log('❌ تم تسجيل الخروج. يرجى مسح مجلد auth_info للربط من جديد.');
            }
        } else if (connection === 'open') {
            console.log('\n✅ [ Kakachi-bot ] البوت متصل الآن ونشط على الواتساب!');
        }
    });
}

startBot();
    
