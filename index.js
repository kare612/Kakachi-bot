const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const replies = require('./replies.js'); // التأكد من استدعاء ملف الردود

async function startKakashiBot() {
    const { state, saveCreds } = await useMultiFileAuthState('Kakashi_Session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            if (shouldReconnect) startKakashiBot();
        } else if (connection === 'open') {
            console.log('✅ تم تشغيل بوت كاكاشي والأوامر جاهزة للاستخدام الآن!');
        }
    });

    // الـ Listener المسؤول عن التقاط الرسائل وتشغيل الأوامر
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return; // تجاهل رسائل البوت نفسه

            // تشغيل دالة معالجة الردود المربوطة بالأوامر
            await replies.handleMessage(sock, msg);
        } catch (err) {
            console.error('خطأ أثناء تشغيل الأمر:', err);
        }
    });
}

startKakashiBot();
