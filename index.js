const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, Boom } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// الإعدادات العامة
global.developer = "212784776925"; 
global.prefix = "."; 
global.ninjaDatabase = global.ninjaDatabase || {};
global.guessGame = global.guessGame || {};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        // إعدادات احترافية لتحسين ثبات الاتصال
        defaultQueryTimeoutMs: undefined,
        keepAliveIntervalMs: 30000
    });

    sock.ev.on('creds.update', saveCreds);

    // طلب كود الربط إذا لم يكن مسجلاً
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(global.developer);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`[+] كود الربط الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
            } catch (error) { console.error("خطأ في طلب كود الربط:", error); }
        }, 5000);
    }

    // استقبال الرسائل والأوامر
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg || !msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? msg.key.participant : from;

            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "";
            const cleanText = body.trim();

            // نظام ألعاب التخمين
            if (global.guessGame && global.guessGame[from]) {
                if (cleanText.toLowerCase() === global.guessGame[from].answer.toLowerCase()) {
                    clearTimeout(global.guessGame[from].timeout);
                    delete global.guessGame[from];
                    return sock.sendMessage(from, { text: `🎉 *إجابة صحيحة مذهلة!* \n\nبطل النقابة الأسرع هو الذي خمن الإجابة الصحيحة 🏆✨` }, { quoted: msg });
                }
            }

            // الرد التلقائي للمطور
            if (body.includes('مطور') || body.includes('المطور')) {
                return sock.sendMessage(from, { text: `👑 *﹝ إدارة كاكاشي بوت ﹞*\n\n👋 للتواصل المباشر مع المطور اضغط هنا:\n🔗 https://wa.me{global.developer}` }, { quoted: msg });
            }

            if (!body.startsWith(global.prefix)) return;

            const args = body.slice(global.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // تشغيل الأوامر تلقائياً من مجلد commands
            const commandFile = path.join(__dirname, 'commands', `${commandName}.js`);
            if (fs.existsSync(commandFile)) {
                const command = require(commandFile);
                await command.run(sock, from, msg, args, commandName);
            }

        } catch (err) { console.error("خطأ في معالجة الرسالة:", err); }
    });

    // إدارة الاتصال بشكل احترافي لتجنب التوقف المفاجئ
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            console.log(`[!] تم إغلاق الاتصال بسبب: ${lastDisconnect.error}. إعادة الاتصال: ${shouldReconnect}`);
            if (shouldReconnect) { startBot(); }
        } else if (connection === 'open') {
            console.log('[+] البوت يعمل الآن بنجاح ومتصل بالواتساب بوضع احترافي🚀');
        }
    });
}

// إنشاء المجلدات الأساسية تلقائياً لمنع الأخطاء
if (!fs.existsSync('./commands')) fs.mkdirSync('./commands');

startBot();
