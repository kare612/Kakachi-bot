const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    Browsers 
} = require('@whiskeysockets/baileys');
const pino = require('pino');

// رقم الهاتف الخاص بك الموثق للربط
const phoneNumber = "212784776925"; 

async function startBot() {
    // إعداد مسار حفظ الجلسة لمنع تسجيل الخروج التلقائي
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // تعطيل نظام الـ QR تماماً للعمل عبر الكود
        logger: pino({ level: 'silent' }), // كتم النصوص البرمجية الزائدة
        
        // 🔒 إعداد أمني أساسي لإيهام الخادم بالاتصال من متصفح نظام لينكس رسمي
        browser: Browsers.ubuntu('Chrome'), 
        syncFullHistory: false, // تقليل حجم البيانات المرسلة منعاً لقطع الاتصال المفاجئ
        markOnlineOnConnect: true
    });

    // طلب كود الربط الرقمي من السيرفر لأول مرة
    if (!sock.authState.creds.registered) {
        // تأخير زمني مستقر بمقدار 5 ثوانٍ لضمان اكتمال تهيئة منافذ الاتصال الأمنية
        console.log(`⏳ جاري تهيئة الاتصال الآمن مع السيرفر.. يرجى الانتظار 5 ثوانٍ...`);
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n========================================`);
                console.log(`🔑 كود الربط الرقمي الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
                console.log(`👉 افتح الواتساب > الأجهزة المرتبطة > ربط هاتف آخر > ربط برقم الهاتف واستخدم الكود أعلاه.`);
            } catch (error) {
                console.error("❌ فشل طلب كود الربط، يرجى المحاولة مرة أخرى لاحقاً:", error.message);
            }
        }, 5000);
    }

    // حفظ بيانات الاعتماد تلقائياً فور إدخال الكود
    sock.ev.on('creds.update', saveCreds);

    // 📩 محرك الردود التلقائية والأوامر البرمجية للبوت
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages;
        if (!msg.message || msg.key.fromMe) return; 

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        console.log(`📩 رسالة واردة من [${from}]: ${text}`);

        // قسم تخصيص الأوامر والردود التلقائية
        if (text === 'السلام عليكم') {
            await sock.sendMessage(from, { text: 'وعليكم السلام ورحمة الله وبركاته! أهلاً بك في البوت الذكي 🤖✨' });
        } 
        else if (text.toLowerCase() === 'الاوامر' || text === 'أوامر') {
            await sock.sendMessage(from, { text: '📜 قائمة الأوامر المتاحة:\n1. السلام عليكم\n2. المطور\n3. تفعيل' });
        } 
        else if (text === 'المطور') {
            await sock.sendMessage(from, { text: '👤 مطور هذا البوت هو صاحب الرقم الموثق: +212784776925' });
        }
        else if (text === 'تفعيل') {
            await sock.sendMessage(from, { text: '✅ تم تفعيل وتشغيل نظام الرد التلقائي بنجاح في هذه المحادثة.' });
        }
    });

    // 🔄 فحص ومراقبة حالة السيرفر وإعادة التشغيل عند الطوارئ
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('🔄 انقطع الاتصال مؤقتاً، جاري إعادة التشغيل التلقائي واختبار السيرفر...');
                startBot(); 
            } else {
                console.log('❌ تم إيقاف الجلسة أو تسجيل الخروج، يجب مسح مجلد auth_info والربط مجدداً.');
            }
        } else if (connection === 'open') {
            console.log('✅ تم تشغيل البوت بنجاح! هو الآن نشط وجاهز للرد التلقائي على الرسائل.');
        }
    });
}

// بدء التشغيل الفعلي
startBot();
