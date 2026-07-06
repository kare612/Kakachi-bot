const { makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');

async function startBot() {
    // تفعيل حفظ الجلسة
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // تعطيل الـ QR Code لتفعيل كود الربط النصي
        logger: pino({ level: 'silent' }), // إخفاء السجلات غير الضرورية لملء الشاشة
        browser: ["Ubuntu", "Chrome", "20.0.04"] // ضروري جداً لتوليد Pairing Code مستقر
    });

    // طلب كود التحقق النصي تلقائياً للرقم الخاص بك
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925"; // الرقم الخاص بك
        await delay(3000); // انتظار ثواني للتأكد من تهيئة السوكت
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log('\n======================================');
            console.log(`🔑 كود ربط الواتساب الخاص بك هو: \x1b[32m${code}\x1b[0m`);
            console.log('======================================\n');
        } catch (error) {
            console.error('❌ فشل في طلب كود التحقق، تأكد من اتصال الإنترنت:', error);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    // إدارة حالة الاتصال
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🔴 انقطع الاتصال، جاري إعادة المحاولة...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ تم تشغيل روبوت كاكاشي بنجاح برقمك وهو جاهز للرد!');
        }
    });

    // معالج استقبال الرسائل والأوامر
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        
        if (text.startsWith('.') || text.startsWith('!')) {
            const args = text.slice(1).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            try {
                const commands = require('./commands.js');
                if (commands[commandName]) {
                    await commands[commandName](sock, from, args, msg);
                }
            } catch (error) {
                console.error('خطأ في الملف البرمجي للأوامر:', error);
            }
        }
    });
}

startBot();
