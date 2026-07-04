const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

// استدعاء ملفات الردود والأوامر الخارجية المنفصلة
const { handleCommand } = require('./commands.js');
const { handleReplies } = require('./replies.js');

global.developer = "212784776925"; 
global.prefix = "."; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    // نظام طلب كود الربط الرقمي لـ Termux
    if (!sock.authState.creds.registered) {
        console.log("⏳ جاري إنشاء قناة اتصال آمنة لاستخراج كود التحقق الرقمي الخاص بك...");
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(global.developer);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`[+] كود الربط الرقمي الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.error("خطأ خادم طلب الرمز، جاري المحاولة اللاحقة...");
            }
        }, 7000); // إعطاء سوكت خوادم واتساب 7 ثوان للاستقرار التام ومنع خطأ 428
    }

    // إدارة تدفق الرسائل الواردة بذكاء وتوزيعها على الملفات المنفصلة
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg || !msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const body = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         msg.message.imageMessage?.caption || "";

            // 1. تفعيل معالج الردود والألعاب التلقائية أولاً بشكل صامت
            await handleReplies(sock, from, msg, body);

            // 2. تفعيل معالج الأوامر الملكية والاقتصاد والمتجر الشامل
            await handleCommand(sock, from, msg, body);

        } catch (err) {
            console.error("خطأ داخلي في توزيع السوكت المكتوب:", err);
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
        } else if (connection === 'open') {
            console.log('[+] كاكاشي بوت متصل ويعمل بنظام المعالجات المنفصلة والـ APIs الفورية للرد!');
        }
    });
}

startBot();
