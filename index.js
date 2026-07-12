const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');

async function startBot() {
    // إنشاء وحفظ جلسة العمل تلقائياً
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // إلغاء كود الـ QR نهائياً لمنع إغلاق الاتصال
        auth: state,
        browser: Browsers.ubuntu('Chrome') // استخدام متصفح مدعوم لتوليد كود الربط
    });

    sock.ev.on('creds.update', saveCreds);

    // طلب كود الربط الرقمي للرقم المعتمد تلقائياً عند التشغيل الأول
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925";
        console.log('⏳ جاري تهيئة الاتصال والانتظار لطلب كود الربط...');
        await delay(12000); // مهلة أمان لضمان استقرار الاتصال بالسيرفر
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log('\n=========================================');
            console.log(`🔥 كود الربط الخاص بك هو: ${code}`);
            console.log('=========================================\n');
        } catch (error) {
            console.error('❌ خطأ في طلب كود الربط، يرجى إعادة التشغيل لاحقاً:', error.message);
        }
    }

    // نظام استقبال الرسائل والأوامر والبحث الذكي عن الفيديوهات
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const text = messageContent.trim();
        const cleanText = text.replace(/^\./, '').toLowerCase();

        // 1. أمر المنيو / عرض الأوامر
        if (cleanText === 'الاوامر' || cleanText === 'menu') {
            const menuText = `⚡ *بوت كاكاشي المطور للميديا* ⚡\n\n` +
                             `🎬 *طريقة تحميل الفيديوهات:* \n` +
                             `• اكتب كلمة *فيديو* متبوعة باسم المقطع الذي تبحث عنه.\n\n` +
                             `📌 *مثال للاستخدام:* \n` +
                             `• فيديو غيبيمارو\n` +
                             `• .فيديو لقطات كرة قدم\n\n` +
                             `✨ يبحث البوت تلقائياً في السيرفرات ويرسل المقطع مباشرة!`;
            await sock.sendMessage(from, { text: menuText }, { quoted: msg });
            return;
        }

        // 2. أمر البحث عن المقطع وإرساله كفيديو حقيقي
        if (text.startsWith('فيديو ') || text.startsWith('.فيديو ')) {
            const query = text.replace(/^(\.فيديو|فيديو)\s+/, '');
            if (!query) return;

            await sock.sendMessage(from, { text: `⏳ جاري البحث عن "${query}" وتحميل الفيديو...` }, { quoted: msg });

            // مصفوفة السيرفرات الحديثة والشغالة بالتناوب
            const apis = [
                `https://cafirexos.com{encodeURIComponent(query)}`,
                `https://dorratz.com{encodeURIComponent(query)}`
            ];

            let success = false;
            for (const apiOfUrl of apis) {
                if (success) break;
                try {
                    const response = await axios.get(apiOfUrl);
                    let videoUrl = response.data?.resultado?.video || response.data?.result?.video?.url || response.data?.result?.video;
                    let title = response.data?.resultado?.titulo || response.data?.result?.title || query;

                    if (videoUrl) {
                        await sock.sendMessage(from, { 
                            video: { url: videoUrl }, 
                            caption: `🎬 *تم التحميل بنجاح:*\n📌 *العنوان:* ${title}\n\n✨ بواسطة بوت كاكاشي المطور` 
                        }, { quoted: msg });
                        success = true;
                        break;
                    }
                } catch (e) {
                    console.log("السيرفر مضغوط، جاري الانتقال للبديل...");
                }
            }
            if (!success) {
                await sock.sendMessage(from, { text: '❌ عذراً، السيرفرات مضغوطة حالياً. يرجى إعادة المحاولة بعد قليل أو تغيير اسم البحث.' }, { quoted: msg });
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🎉 تم اتصال البوت بنجاح ومستعد لتلقي الأوامر من التحديث الجديد!');
        }
    });
}

startBot();
    
