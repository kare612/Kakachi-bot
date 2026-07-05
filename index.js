const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { handleCommand } = require('./commands.js');

global.developer = "212784776925"; // رقم المطور
global.prefix = "."; // رمز الأوامر

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    // توليد كود التحقق الرقمي تلقائياً للربط في تيرموكس
    if (!sock.authState.creds.registered) {
        console.log("⏳ جاري الاتصال بخوادم واتساب لتوليد كود الربط الخاص بك...");
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(global.developer);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`[+] كود الربط الرقمي الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.error("خطأ في طلب الرمز، جاري إعادة المحاولة تلقائياً...");
            }
        }, 7000); 
    }

    // استقبال الرسائل وتوجيهها لمعالج الأوامر والردود تلقائياً
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg || !msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const body = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         msg.message.imageMessage?.caption || "";

            await handleCommand(sock, from, msg, body);

        } catch (err) {
            console.error("خطأ في معالجة الرسالة الواردة:", err);
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('[+] كاكاشي بوت متصل الآن بنجاح وجاهز للرد على الأوامر!');
        }
    });
}

startBot();
