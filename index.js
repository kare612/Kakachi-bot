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
    // إعداد وتخزين ملفات الجلسة
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // الاعتماد الكلي على كود الربط الرقمي
        logger: pino({ level: 'silent' }), // إيقاف الرسائل والنصوص المزعجة
        
        // 🔒 إعدادات متطورة لتخطي حماية واتساب ومنع ظهور خطأ 428
        browser: Browsers.ubuntu('Chrome'), 
        syncFullHistory: false, // تعطيل جلب أرشيف الرسائل القديمة لسرعة الاتصال وثباته
        markOnlineOnConnect: true
    });

    // طلب كود الربط الرقمي من السيرفر عند أول تشغيل
    if (!sock.authState.creds.registered) {
        // تأخير عشوائي مابين 4 إلى 6 ثوانٍ لتهيئة قنوات الاتصال بأمان قبل الطلب
        const delayMs = 4000 + Math.floor(Math.random() * 2000);
        console.log(`⏳ جاري تهيئة الاتصال الأمن.. يرجى الانتظار ${delayMs / 1000} ثوانٍ...`);
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n========================================`);
                console.log(`🔑 كود الربط الرقمي الخص بك: ${code}`);
                console.log(`========================================\n`);
                console.log(`👉 افتح واتساب هاتف > الأجهزة المرتبطة > ربط هاتف آخر > ربط برقم الهاتف وأدخل الكود الموضح أعلاه.`);
            } catch (error) {
                console.error("❌ فشل طلب الكود مجدداً، تأكد من إغلاق أي جلسات واتساب ويب نشطة وجرب لاحقاً:", error.message);
            }
        }, delayMs);
    }

    // حفظ بيانات تسجيل الدخول تلقائياً
    sock.ev.on('creds.update', saveCreds);

    // 📩 نظام الرد التلقائي والأوامر البرمجية للبوت
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return; 

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        console.log(`📩 رسالة واردة من [${from}]: ${text}`);

        // الأوامر البرمجية المتاحة (يمكنك نسخ الشروط وإضافة المزيد بسهولة)
        if (text === 'السلام عليكم') {
            await sock.sendMessage(from, { text: 'وعليكم السلام ورحمة الله وبركاته! أهلاً بك في البوت الذكي 🤖✨' });
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
    });

    // 🔄 مراقبة حالة السيرفر وإعادة الاتصال عند الطوارئ
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('🔄 انقطع الاتصال مؤقتاً، جاري إعادة التشغيل التلقائي...');
                startBot(); 
            } else {
                console.log('❌ تم إيقاف الجلسة أو طرد البوت، يجب مسح مجلد auth_info وإعادة الربط.');
            }
        } else if (connection === 'open') {
            console.log('✅ تم تشغيل البوت بنجاح! هو الآن نشط وجاهز للرد التلقائي على الرسائل.');
        }
    });
}

// بدء التشغيل الفعلي للملف
startBot();
