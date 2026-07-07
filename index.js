const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    Browsers 
} = require('@whiskeysockets/baileys');
const pino = require('pino');

// رقم الهاتف الخاص بك
const phoneNumber = "212784776925"; 

async function startBot() {
    // إنشاء مجلد حفظ الجلسة
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // الاعتماد كلياً على الكود الرقمي
        logger: pino({ level: 'silent' }), // كتم أي نصوص برمجية زائدة
        
        // 🔒 متصفح متوافق لتفادي الحظر الفوري 428
        browser: Browsers.ubuntu('Chrome'), 
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    // طلب كود الربط الرقمي من السيرفر لأول مرة
    if (!sock.authState.creds.registered) {
        console.log(`⏳ يتم الآن تهيئة اتصال آمن وصامت مع الخادم.. انتظر 6 ثوانٍ...`);
        
        // 🛠️ تأخير أمني بمقدار 6 ثوانٍ لضمان استقرار قنوات الاتصال قبل طلب الكود
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n========================================`);
                console.log(`🔑 كود الربط الرقمي الشغال هو: ${code}`);
                console.log(`========================================\n`);
                console.log(`👉 افتح الواتساب > الأجهزة المرتبطة > ربط هاتف آخر > ربط برقم الهاتف واستخدم الكود أعلاه.`);
            } catch (error) {
                console.error("❌ فشل السيرفر في توليد الكود، جرب تشغيل الملف مرة أخرى:", error.message);
            }
        }, 6000);
    }

    // حفظ بيانات تسجيل الدخول تلقائياً فور الربط
    sock.ev.on('creds.update', saveCreds);

    // 📩 محرك الأوامر والردود التلقائية للبوت
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages;
        if (!msg.message || msg.key.fromMe) return; 

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        console.log(`📩 رسالة واردة من [${from}]: ${text}`);

        // قسم الأوامر (تستطيع إضافة ما تريد هنا)
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
    });

    // 🔄 مراقبة حالة الاتصال وإعادة التشغيل عند الطوارئ
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('🔄 انقطع الاتصال مؤقتاً، جاري إعادة التشغيل التلقائي واختبار السيرفر...');
                startBot(); 
            } else {
                console.log('❌ تم تسجيل الخروج، يجب مسح مجلد auth_info والربط مجدداً.');
            }
        } else if (connection === 'open') {
            console.log('✅ تم تشغيل البوت بنجاح! هو الآن نشط وجاهز للرد التلقائي على الرسائل.');
        }
    });
}

// تشغيل البوت
startBot();
