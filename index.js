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
    // إنشاء أو جلب الجلسة من مجلد auth_info
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // تعطيل الـ QR تماماً والاعتماد على الكود
        logger: pino({ level: 'silent' }), // إخفاء الرسائل المزعجة في الترمينال
        
        // 🛠️ أهم سطر لتفادي خطأ 428 (يوهم خوادم واتساب بأنه متصفح كروم رسمي)
        browser: Browsers.macOS('Desktop') 
    });

    // طلب كود الربط الرقمي إذا لم يكن الحساب مسجلاً مسبقاً
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n========================================`);
                console.log(`🔑 كود الربط الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
                console.log(`👉 افتح الواتساب > الأجهزة المرتبطة > ربط هاتف آخر > ربط برقم الهاتف واستخدم الكود أعلاه.`);
            } catch (error) {
                console.error("❌ فشل طلب كود الربط، تأكد من تحديث المكتبة وحذف مجلد auth_info:", error);
            }
        }, 4000); // مهلة 4 ثوانٍ للتأكد من استقرار الاتصال قبل طلب الكود
    }

    // حفظ التغييرات على الجلسة بشكل تلقائي عند الربط
    sock.ev.on('creds.update', saveCreds);

    // 📩 الاستماع للرسائل الواردة والرد عليها تلقائياً
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return; // تجاهل الرسائل الفارغة أو المرسلة منك

        const from = msg.key.remoteJid;
        // جلب نص الرسالة بأكثر من طريقة لضمان قراءتها
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        console.log(`📩 رسالة جديدة من [${from}]: ${text}`);

        // 🤖 قسم الأوامر والرد التلقائي (عدل وضف ما تشاء هنا)
        if (text.toLowerCase() === 'السلام عليكم') {
            await sock.sendMessage(from, { text: 'وعليكم السلام ورحمة الله وبركاته! أهلاً بك في البوت 🤖✨' });
        } 
        else if (text.toLowerCase() === 'الاوامر' || text.toLowerCase() === 'أوامر') {
            await sock.sendMessage(from, { text: '📜 قائمة الأوامر المتاحة:\n1. السلام عليكم\n2. المطور\n3. تفعيل' });
        } 
        else if (text.toLowerCase() === 'المطور') {
            await sock.sendMessage(from, { text: '👤 مطور هذا البوت هو صاحب الرقم: +212784776925' });
        }
        else if (text.toLowerCase() === 'تفعيل') {
            await sock.sendMessage(from, { text: '✅ تم تفعيل البوت بنجاح في هذه المجموعة/الدردشة.' });
        }
    });

    // 🔄 مراقبة حالة الاتصال وإعادة التشغيل الذكي عند الانقطاع
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🔄 تم قطع الاتصال بسبب: ', lastDisconnect?.error, ' | جاري إعادة المحاولة: ', shouldReconnect);
            
            if (shouldReconnect) {
                startBot(); // إعادة تشغيل البوت تلقائياً
            } else {
                console.log('❌ تم تسجيل الخروج من الهاتف، يجب عليك حذف مجلد auth_info والربط من جديد.');
            }
        } else if (connection === 'open') {
            console.log('✅ تم اتصال البوت بنجاح وهو يعمل الآن دون مشاكل!');
        }
    });
}

// تشغيل البوت للمرة الأولى
startBot();
                
