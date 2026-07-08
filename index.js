const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    Browsers 
} = require('@whiskeysockets/baileys');
const pino = require('pino');

// رقم الهاتف الخاص بك والمعتمد في المستودع
const phoneNumber = "212784776925"; 

async function startBot() {
    // إنشاء أو قراءة مجلد حفظ الجلسة
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // الاعتماد الكلي على الكود الرقمي
        logger: pino({ level: 'silent' }), // كتم النصوص الزائدة
        
        // 🔒 تحديث المتصفح إلى نسخة موثوقة (Chrome على Mac) لتفادي حظر السيرفرات الفوري 428 و Connection Closed
        browser: ['Mac OS', 'Chrome', '121.0.0.0'], 
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    // طلب كود الربط الرقمي من السيرفر لأول مرة
    if (!sock.authState.creds.registered) {
        console.clear();
        console.log(`\n[ Kakachi-bot ] Connecting to WhatsApp for: ${phoneNumber}...`);
        console.log(`⏳ Please wait 6 seconds to fetch your secure code...`);
        
        // تأخير أمني بمقدار 6 ثوانٍ لضمان استقرار قنوات الاتصال قبل طلب الكود
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code; // تنسيق الكود ليظهر بشكل (XXXX-XXXX)
                console.log(`\n========================================`);
                console.log(`🔑 YOUR PAIRING CODE IS: \x1b[32m${code}\x1b[0m`);
                console.log(`========================================\n`);
                console.log(`👉 Open WhatsApp > Linked Devices > Link with phone number and enter this code.`);
            } catch (error) {
                console.error("❌ Failed to generate code. Delete auth_info and try again:", error.message);
            }
        }, 6000);
    }

    // حفظ بيانات تسجيل الدخول تلقائياً فور الربط
    sock.ev.on('creds.update', saveCreds);

    // 📩 محرك الأوامر والردود التلقائية للبوت المربوط بملفك الأساسي
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages;
            if (!msg || !msg.message || msg.key.fromMe) return; 

            const from = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

            console.log(`📩 Message from [${from}]: ${text}`);

            // استدعاء ملف الأوامر المجمع الخارجي الخاص بمستودعك commands.js
            try {
                const { handleCommand } = require('./commands');
                await handleCommand(sock, msg, from, text);
            } catch {
                // ردود افتراضية سريعة في حال عدم توفر ملف الأوامر المجمع بشكل صحيح
                if (text === 'السلام عليكم') {
                    await sock.sendMessage(from, { text: 'وعليكم السلام ورحمة الله وبركاته! أهلاً بك في بوت كاكاشي 🤖✨' });
                } 
                else if (text === 'الاوامر' || text === 'أوامر') {
                    await sock.sendMessage(from, { text: '📜 قائمة الأوامر المتاحة:\n1. السلام عليكم\n2. المطور' });
                } 
                else if (text === 'المطور') {
                    await sock.sendMessage(from, { text: '👤 مطور هذا البوت هو صاحب الرقم الموثق: +212784776925' });
                }
            }
        } catch (err) {
            console.error("❌ Error in message handler:", err);
        }
    });

    // 🔄 مراقبة حالة الاتصال وإعادة التشغيل تلقائياً عند الطوارئ
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('🔄 Connection closed by server. Retrying in 5 seconds...');
                setTimeout(() => startBot(), 5000); 
            } else {
                console.log('❌ Logged out! Please delete auth_info folder and pair again.');
            }
        } else if (connection === 'open') {
            console.log('\n✅ [ Kakachi-bot ] Connected successfully and active now!');
        }
    });
}

// تشغيل البوت
startBot();
