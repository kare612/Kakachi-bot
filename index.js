// ملف التشغيل الرئيسي index.js لبوت كاكاشي المربوط بكود التحقق الرقمي
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const pino = require('pino');
const fs = require('fs');

// الرقم الخاص بك في صيغة E.164 الدولية المطلوبة للربط البرمجي بدون علامة +
const phoneNumber = "212784776925"; 

async function startKakashiBot() {
    // 1. تحديد مجلد حفظ بيانات الجلسة (Session) لتفادي طلب الكود في كل مرة
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'session'));
    const { version } = await fetchLatestBaileysVersion();

    // 2. إعداد سوكيت اتصال البوت بالسيرفرات والتحكم بتعطيل طبع الـ QR في التيرمنال
    const client = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }), // إخفاء السجلات التقنية المعقدة
        printQRInTerminal: false,           // تعطيل الـ QR كلياً بناءً على طلبك
        browser: ['Ubuntu', 'Chrome', '20.0.0'] // إعداد متصفح وهمي للتعرف السليم
    });

    // 3. كود طلب وإنتاج كود الربط الرقمي (Pairing Code)
    if (!client.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await client.requestPairingCode(phoneNumber);
                // تصفية الكود وطباعته بشكل منسق يسهل قراءته ونسخه
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n🔑 [كود ربط بوت كاكاشي الخاص بك هو]:  ${code}\n`);
                console.log(`ℹ️ افتح هاتفك -> الأجهزة المرتبطة -> ربط برقم الهاتف -> واكتب الكود أعلاه.\n`);
            } catch (error) {
                console.error("❌ فشل جلب كود التحقق الرقمي، تأكد من اتصال الإنترنت:", error);
            }
        }, 3000); // تأخير المعالجة 3 ثوانٍ لضمان استقرار السوكيت
    }

    // 4. الاستماع لتحديثات الجلسة وحفظها دورياً لعدم الخروج التلقائي
    client.ev.on('creds.update', saveCreds);

    // 5. معالجة الأحداث والاتصال وإعادة التشغيل التلقائي عند انقطاع الشبكة
    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) 
                ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut 
                : true;
            
            console.log('⚠️ تم إغلاق الاتصال، جاري محاولة إعادة تشغيل البوت تلقائياً...', shouldReconnect);
            
            if (shouldReconnect) {
                startKakashiBot(); // إعادة تشغيل ذاتي للبوت
            }
        } else if (connection === 'open') {
            console.log('✅ تم ربط البوت برقمك بنجاح! بوت كاكاشي يعمل الآن بأعلى كفاءة.');
        }
    });

    // 6. ربط وقراءة كافة ملفات الإضافات (Plugins) التي قمنا بصنعها سابقاً وتمرير الرسائل لها
    client.ev.on('messages.upsert', async chatUpdate => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return; // تجاهل الرسائل الفارغة والمرسلة من البوت نفسه

            // جلب النص البرمجي وفصل الأمر (Prefix)
            const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
            if (!text.startsWith('.')) return;

            const args = text.trim().split(/ +/).slice(1).join(' ');
            const commandName = text.trim().split(/ +/)[0].slice(1).toLowerCase();

            // فحص وتشغيل ملفات الإضافات ديناميكياً
            const pluginsDir = path.join(__dirname, 'plugins');
            if (fs.existsSync(pluginsDir)) {
                const files = fs.readdirSync(pluginsDir);
                for (const file of files) {
                    if (file.endsWith('.js')) {
                        const plugin = require(path.join(pluginsDir, file));
                        if (plugin.name === commandName || plugin.alias?.includes(commandName)) {
                            // تمرير العوامل المخصصة لملفات الألعاب والذكاء والنقابات المكتوبة سابقاً
                            const isOwner = m.key.remoteJid.includes(phoneNumber);
                            const participants = m.key.remoteJid.endsWith('@g.us') 
                                ? (await client.groupMetadata(m.key.remoteJid)).participants 
                                : [];
                            
                            await plugin.execute(client, m, { text: args, args: args.split(' '), participants, isOwner });
                            break;
                        }
                    }
                }
            }
        } catch (err) {
            console.error("خطأ في معالجة إضافات الرسائل الواردة:", err);
        }
    });
}

// تشغيل البوت الأساسي فور استدعاء الملف عبر التيرمنال
startKakashiBot();
                              
