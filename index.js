const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // إلغاء الـ QR لتفعيل كود الربط الرقمي
        auth: state,
        browser: Browsers.ubuntu('Chrome')
    });

    sock.ev.on('creds.update', saveCreds);

    // طلب كود الربط الرقمي تلقائياً عند التشغيل الأول
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925";
        console.log('⏳ جاري تهيئة الاتصال والانتظار لطلب كود الربط...');
        await delay(12000); 
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log('\n=========================================');
            console.log(`🔥 كود الربط الخاص بك هو: ${code}`);
            console.log('=========================================\n');
        } catch (error) {
            console.error('❌ خطأ في طلب كود الربط:', error.message);
        }
    }

    // نظام استقبال الأوامر والبحث الذكي عن الفيديوهات عبر الـ API الخاص بك
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const text = messageContent.trim();
        const cleanText = text.replace(/^\./, '').toLowerCase();

        // أمر عرض قائمة الأوامر
        if (cleanText === 'الاوامر' || cleanText === 'menu') {
            const menuText = `⚡ *بوت كاكاشي الذكي للميديا* ⚡\n\n` +
                             `🎬 *طريقة تحميل الفيديوهات:* \n` +
                             `• اكتب كلمة *فيديو* متبوعة باسم المقطع.\n\n` +
                             `📌 *مثال للاستخدام:* \n` +
                             `• فيديو غيبيمارو\n\n` +
                             `✨ يبحث البوت تلقائياً في السيرفرات ويرسل المقطع مباشرة!`;
            await sock.sendMessage(from, { text: menuText }, { quoted: msg });
            return;
        }

        // أمر البحث وتحميل الفيديوهات بالاسم
        if (text.startsWith('فيديو ') || text.startsWith('.فيديو ')) {
            const query = text.replace(/^(\.فيديو|فيديو)\s+/, '');
            if (!query) return;

            await sock.sendMessage(from, { text: `⏳ جاري البحث عن "${query}" عبر الـ API الخاص بك...` }, { quoted: msg });

            try {
                // ↙️ هنا تقوم بوضع رابط الـ API الجديد الخاص بك بدلاً من الروابط السابقة
                const myApiUrl = `https://cafirexos.com{encodeURIComponent(query)}`;
                
                const response = await axios.get(myApiUrl);
                
                // استخراج رابط الفيديو من نتيجة الـ API (عدّلها حسب هيكلة السيرفر الخاص بك)
                let videoUrl = response.data?.resultado?.video || response.data?.result?.video?.url || response.data?.result?.video;
                let title = response.data?.resultado?.titulo || response.data?.result?.title || query;

                if (videoUrl) {
                    await sock.sendMessage(from, { 
                        video: { url: videoUrl }, 
                        caption: `🎬 *تم التحميل بنجاح:*\n📌 *العنوان:* ${title}\n\n✨ بواسطة بوت كاكاشي المطور` 
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { text: '❌ عذراً، الـ API لم يرجع أي رابط فيديو صالح لهذا الاسم.' }, { quoted: msg });
                }
            } catch (e) {
                console.error("خطأ في الـ API الخاص بك:", e.message);
                await sock.sendMessage(from, { text: '❌ حدث خطأ أثناء الاتصال بالـ API، يرجى التحقق من مفتاح التشغيل أو الرابط.' }, { quoted: msg });
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🎉 تم الاتصال بنجاح وتفعيل الـ API الجديد!');
        }
    });
}

startBot();
