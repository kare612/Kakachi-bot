const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('bot_session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    // سيتم طلب كود التحقق لرقمك تلقائياً بعد تشغيل السكربت بـ 6 ثوانٍ
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
                console.log("❌ انتهت صلاحية الطلب أو السيرفر مضغوط، انتظر دقيقة ثم أعد التشغيل.");
            }
        }, 6000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✨ مبروك! تم تشغيل البوت بنجاح عبر كود الربط! ✨');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages;
        if (!msg.message || msg.key.fromMe) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const from = msg.key.remoteJid;

        if (text === '.تست') {
            await sock.sendMessage(from, { text: '🤖 البوت يعمل بنجاح ومستعد للأوامر!' });
        }
    });
}

startBot().catch(err => console.log(err));
  
