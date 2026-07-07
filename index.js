const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    Browsers 
} = require('@whiskeysockets/baileys');
const pino = require('pino');

// رقم الهاتف الخاص بك مع رمز الدولة
const phoneNumber = "212784776925"; 

async function startBot() {
    // إنشاء مجلد حفظ الجلسة
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // تعطيل الـ QR كلياً
        logger: pino({ level: 'silent' }), // كتم النصوص الزائدة
        browser: Browsers.ubuntu('Chrome'), // متصفح متوافق لتفادي الحظر
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    // طلب كود الربط الرقمي باحترافية وفوراً
    if (!sock.authState.creds.registered) {
        console.log(`⏳ جاري الاتصال بالخادم وتوليد كود الربط ل الرقم: ${phoneNumber}...`);
        
        // تأخير بسيط جداً (3 ثوانٍ) لضمان جاهزية المقبس (Socket) قبل طلب الكود
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code; // تنسيق الكود لشكل مقروء (XXXX-XXXX)
                console.log(`\n========================================`);
                console.log(`🔑 كود الربط الرقمي الشغال هو: ${code}`);
                console.log(`========================================\n`);
                console.log(`👉 افتح الواتساب > الأجهزة المرتبطة > ربط هاتف آخر > ربط برقم الهاتف واستخدم الكود أعلاه.`);
            } catch (error) {
                console.error("❌ فشل في توليد الكود. تأكد من رقم الهاتف أو جرب تشغيل الملف مجدداً:", error.message);
            }
        }, 3000);
    }

    // حفظ بيانات تسجيل الدخول تلقائياً
    sock.ev.on('creds.update', saveCreds);

    // 📩 محرك الأوامر والردود التلقائية
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]; // إصلاح طريقة جلب الرسالة الأولى
            if (!msg || !msg.message || msg.key.fromMe) return; 

            const from = msg.key.remoteJid;
            // إصلاح قراءة نص الرسالة الشامل (نص عادي، نص ممتد، أو نص رد)
            const text = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         msg.message.imageMessage?.caption || "";

            console.log(`📩 رسالة واردة من [${from}]: ${text}`);

            // قسم الأوامر واختبار النصوص بالكامل
            if (text === 'السلام عليكم') {
                await sock.sendMessage(from, { text: 'وعليكم السلام ورحمة الله وبركاته! أهلاً بك في البوت 🤖✨' });
            } 
            else if (text === 'الاوامر' || text === 'أوامر') {
                await sock.sendMessage(from, { text: '📜 قائمة الأوامر المتاحة:\n1. السلام عليكم\n2. المطور\n3. تفعيل' });
            } 
            else if (text === 'المطور') {
                await sock.sendMessage(from, { text: '👤 مطور هذا البوت هو صاحب الرقم الموثق: +212784776925' });
            }
            else if (text === 'تفعيل') {
                await sock.sendMessage(from, { text: '✅ تم تفعيل وتشغيل نظام الرد التلقائي بنجاح في هذه المحادثة.' });
            }
        } catch (err) {
            console.error("❌ خطأ في معالجة الرسالة الواردة:", err);
        }
    });

    // 🔄 مراقبة حالة الاتصال
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('🔄 انقطع الاتصال مؤقتاً، جاري إعادة التشغيل التلقائي...');
                startBot(); 
            } else {
                console.log('❌ تم تسجيل الخروج، يجب مسح مجلد auth_info والربط مجدداً باستخدام كود جديد.');
            }
        } else if (connection === 'open') {
            console.log('\n✅ تم تشغيل البوت بنجاح! هو الآن نشط وجاهز للرد التلقائي على الرسائل.');
        }
    });
}

// تشغيل البوت
startBot();
            
