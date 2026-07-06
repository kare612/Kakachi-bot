const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

// رقم الهاتف الخاص بك الذي زودتني به
const phoneNumber = "212784776925"; 

async function startBot() {
    // حفظ الجلسة في مجلد auth_info لمنع تسجيل الخروج
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // تعطيل الـ QR كلياً
        logger: pino({ level: 'silent' }) // إخفاء سجلات النظام المزعجة
    });

    // طلب كود الربط الرقمي إذا لم يكن مسجلاً مسبقاً
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n========================================`);
                console.log(`🔑 كود الربط الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
                console.log(`👉 افتح الواتساب > الأجهزة المرتبطة > ربط هاتف آخر > ربط برقم الهاتف واستخدم الكود أعلاه.`);
            } catch (error) {
                console.error("خطأ أثناء طلب كود الربط:", error);
            }
        }, 3000); // مهلة للتأكد من اتصال السيرفر
    }

    // الاستماع للرسائل الواردة والرد عليها (الأوامر)
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return; // تجاهل الرسائل الفارغة أو المرسلة منك

        const from = msg.key.remoteJid;
        // جلب نص الرسالة سواء كانت نص عادي أو نص من زر/قائمة
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        console.log(`رسالة جديدة من [${from}]: ${text}`);

        // 👇 هنا يمكنك إضافة وتعديل الأوامر والردود كما تريد 👇
        if (text.toLowerCase() === 'السلام عليكم') {
            await sock.sendMessage(from, { text: 'وعليكم السلام ورحمة الله وبركاته! أهلاً بك في البوت.' });
        } 
        else if (text.toLowerCase() === 'الاوامر' || text.toLowerCase() === 'أوامر') {
            await sock.sendMessage(from, { text: '📜 قائمة الأوامر المتاحة:\n1. السلام عليكم\n2. المطور' });
        } 
        else if (text.toLowerCase() === 'المطور') {
            await sock.sendMessage(from, { text: 'مطور هذا البوت هو صاحب الرقم: +212784776925' });
        }
    });

    // حفظ التغييرات على الجلسة بشكل تلقائي
    sock.ev.on('creds.update', saveCreds);

    // إعادة الاتصال التلقائي في حال الانقطاع
    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') {
            console.log('🔄 تم قطع الاتصال، جاري إعادة التشغيل...');
            startBot();
        } else if (connection === 'open') {
            console.log('✅ تم اتصال البوت بنجاح وهو جاهز للرد الآن!');
        }
    });
}

startBot();
