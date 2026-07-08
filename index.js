const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    Browsers 
} = require('@whiskeysockets/baileys');
const pino = require('pino');

async function connectToWhatsApp() {
    // إنشاء مجلد لحفظ الجلسة حتى لا يطلب الكود في كل مرة
    const { state, saveCreds } = await useMultiFileAuthState('./session_kakashi');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // ❌ تم إيقاف الـ QR نهائياً
        auth: state,
        browser: Browsers.macOS('Chrome') // 🖥️ محاكاة متصفح لطلب الكود الرقمي
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;

        // إذا كان البوت غير مرتبط برقم هاتف بعد
        if (!sock.authState.creds.registered) {
            const botNumber = "212784776925"; // رقم المطور المراد ربطه

            if (connection === 'connecting' || qr) {
                setTimeout(async () => {
                    try {
                        // 🔑 استدعاء ميزة الكود الرقمي من مكتبة واتساب
                        const code = await sock.requestPairingCode(botNumber);
                        
                        console.log(`\n========================================`);
                        console.log(`🔮 كود الربط الرقمي لبوت كاكاشي هو:`);
                        console.log(`👉  \x1b[32m\x1b[1m${code}\x1b[0m  👈`); // سيظهر الكود بلون أخضر عريض
                        console.log(`========================================`);
                        console.log(`ادخل إلى واتساب -> الأجهزة المرتبطة -> ربط برقم الهاتف، واكتب الكود.\n`);
                    } catch (err) {
                        console.error("❌ خطأ أثناء طلب الكود الرقمي:", err);
                    }
                }, 3000); // مهلة 3 ثوانٍ لضمان استقرار الاتصال قبل الطلب
            }
        }

        if (connection === 'open') {
            console.log('[✅] تم ربط البوت بنجاح وهو يعمل الآن عبر الكود الرقمي!');
        }
    });

    // استيراد ومعالجة الأوامر من ملف الأوامر الخاص بك
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            // هنا يتم استدعاء معالج الأوامر لديك (مثال لتشغيل الملفات الأخرى)
            if (global.commands) {
                // دالة تشغيل الأوامر الخاصة ببوت كاكاشي
            }
        } catch (error) {
            console.log(error);
        }
    });
}

connectToWhatsApp();
