const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
require('dotenv').config(); // Load environment variables

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu('Chrome')
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER || "212784776925";
        console.log('⏳ جاري تهيئة الاتصال...');
        await delay(12000);
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log('\n=========================================');
            console.log(`🔥 كود الربط: ${code}`);
            console.log('=========================================\n');
        } catch (error) {
            console.error('❌ خطأ:', error.message);
        }
    }

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const text = messageContent.trim();

        if (text === '.الاوامر' || text === 'الاوامر' || text === '.menu') {
            const menuText = `⚡ *بوت كاكاشي* ⚡\n\n🎬 اكتب: فيديو <الاسم>`;
            await sock.sendMessage(from, { text: menuText }, { quoted: msg });
            return;
        }

        if (text.startsWith('فيديو ') || text.startsWith('.فيديو ')) {
            const query = text.replace(/^(\.فيديو|فيديو)\s+/, '');
            if (!query) return;

            const apis = [
                `https://cafirexos.com?q=${encodeURIComponent(query)}`,
                `https://dorratz.com?q=${encodeURIComponent(query)}`
            ];

            let success = false;
            for (const apiUrl of apis) {
                if (success) break;
                try {
                    const response = await axios.get(apiUrl);
                    const videoUrl = response.data?.resultado?.video || response.data?.result?.video?.url || response.data?.result?.video;
                    const title = response.data?.resultado?.titulo || response.data?.result?.title || query;

                    if (videoUrl) {
                        await sock.sendMessage(from, { 
                            video: { url: videoUrl }, 
                            caption: `🎬 تم التحميل: ${title}` 
                        }, { quoted: msg });
                        success = true;
                    }
                } catch (e) {
                    console.log("السيرفر مضغوط، الانتقال للبديل...");
                }
            }

            if (!success) {
                await sock.sendMessage(from, { text: '❌ السيرفرات مضغوطة حالياً. أعد المحاولة لاحقاً.' }, { quoted: msg });
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🎉 البوت متصل وجاهز!');
        }
    });
}

startBot().catch(console.error);
