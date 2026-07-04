const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false // تعطيل الـ QR ليعمل الكود الرقمي
    });

    sock.ev.on('creds.update', saveCreds);

    // 1. كود توليد رمز التحقق الرقمي بدون QR
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925"; 
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`[+] كود الربط الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.error("خطأ أثناء طلب كود الربط:", error);
            }
        }, 3000);
    }

    // 2. كود استقبال الرسائل والرد عليها تلقائياً
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return; // تجاهل الرسائل الفارغة ورسائل البوت نفسه

            const from = msg.key.remoteJid; // رقم الشخص المرسل
            // استخراج نص الرسالة سواء كانت نصية عادية أو نص من رسالة ممتدة
            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const text = body.toLowerCase().trim();

            // أمثلة بسيطة للرد التلقائي (يمكنك تعديلها أو ربطها بمجلد الأوامر لاحقاً)
            if (text === 'هلا' || text === 'السلام عليكم') {
                await sock.sendMessage(from, { text: 'وعليكم السلام ورحمة الله وبركاته! كيف يمكنني مساعدتك؟ 🤖' }, { quoted: msg });
            } else if (text === 'الاوامر' || text === 'الأوامر') {
                await sock.sendMessage(from, { text: 'قائمة الأوامر قيد التطوير حالياً متاح فقط: (هلا)' }, { quoted: msg });
            }

        } catch (err) {
            console.error("خطأ في معالجة الرسالة:", err);
        }
    });

    // إعادة الاتصال التلقائي في حال انقطع
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('[+] البوت متصل الآن بنجاح وجاهز للرد على الرسائل!');
        }
    });
}

startBot();
