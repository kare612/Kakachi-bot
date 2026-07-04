const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('kakachi_session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '110.0.5563.147']
    });

    sock.ev.on('creds.update', saveCreds);

    // طلب كود التحقق الرقمي تلقائياً لرقمك المغربي
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925"; 
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log('\n=============================================');
                console.log(`🔥 كود ربط واتساب الخاص بك هو: 【 ${code} 】 🔥`);
                console.log('=============================================\n');
            } catch (err) {
                console.log("❌ انتظر دقيقة ثم أعد تشغيل السكربت.");
            }
        }, 5000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') startBot();
        else if (connection === 'open') console.log('✨ تم تشغيل بوت كاكاشي بنجاح! ✨');
    });

    // الذكاء المسؤول عن قراءة وتنفيذ آلاف الأوامر تلقائياً دون تعديل هذا الملف
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const from = msg.key.remoteJid;

        if (!text.startsWith('.')) return; // الرمز المخصص للأوامر هو نقطة
        const args = text.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // قراءة الملفات من مجلد الأوامر تلقائياً
        const cmdPath = path.join(__dirname, 'commands', `${commandName}.js`);
        if (fs.existsSync(cmdPath)) {
            try {
                const cmd = require(cmdPath);
                await cmd.execute(sock, msg, from, args);
            } catch (err) {
                console.error(err);
            }
        }
    });
}
startBot().catch(err => console.log(err));
            
