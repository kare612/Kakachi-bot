const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // إيقاف الـ QR كود
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // طلب كود الربط الرقمي للرقم المعتمد
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925";
        await delay(3000); 
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log('\n=========================================');
            console.log(`🔥 كود الربط الخاص بك هو: ${code}`);
            console.log('=========================================\n');
        } catch (error) {
            console.error('حدث خطأ أثناء طلب كود الربط:', error);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            console.log('تم إغلاق الاتصال، جاري إعادة الاتصال...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🎉 تم اتصال البوت بنجاح ومستعد لتلقي الأوامر!');
        }
    });
}

startBot();
