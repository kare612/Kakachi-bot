const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    delay
} = require('@whiskeysockets/baileys');
const P = require('pino');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    // 1. إعداد حالة التوثيق وحفظ الجلسة في مجلد session
    const { state, saveCreds } = await useMultiFileAuthState('session');

    // 2. إنشاء اتصال السوكيت مع إعدادات محاكاة متصفح متوافقة مع Termux
    const client = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false, // تعطيل الـ QR لاعتماد كود الربط
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"] // تعديل لحل خطأ الـ 428
    });

    // 3. التحقق وطلب كود الربط الرقمي تلقائياً عند الحاجة
    if (!client.authState.creds.registered) {
        // الرقم الجديد المراد ربطه بالبوت
        const phoneNumber = '212715469251'; 
        
        console.log(`[🔄] جاري تهيئة الاتصال لطلب كود الربط للرقم: ${phoneNumber}...`);
        
        // تأخير برمي لمدة 5 ثوانٍ لضمان استقرار الـ WebSocket وتفادي فصل الخادم
        await delay(5000); 

        try {
            let code = await client.requestPairingCode(phoneNumber);
            // إزالة الفواصل البرمجية لسهولة النسخ
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log(`\n======================================`);
            console.log(`🔑 كود الربط الرقمي الخاص بك هو: ${code}`);
            console.log(`======================================\n`);
        } catch (error) {
            console.error('❌ فشل توليد كود الربط، يرجى مسح مجلد session وإعادة المحاولة:', error.message);
        }
    }

    // 4. مراقبة أحداث الاتصال
    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[⚠️] انقطع الاتصال بسبب: ${lastDisconnect?.error?.message}. إعادة الاتصال: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                startBot(); // إعادة التشغيل تلقائياً
            }
        } else if (connection === 'open') {
            console.log('[✅] تم ربط روبوت كاكاشي بنجاح بالواتساب واشتغل الآن!');
        }
    });

    // 5. حفظ بيانات التوثيق عند تحديثها
    client.ev.on('creds.update', saveCreds);
}

startBot();
