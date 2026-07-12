const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu('Chrome')
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const text = messageContent.trim();

        // 1. أمر عرض قائمة الأوامر (المنيو)
        if (text === '.الاوامر' || text === 'الاوامر' || text === '.menu') {
            const menuText = `⚡ *بوت كاكاشي الذكي للميديا* ⚡\n\n` +
                             `🎬 *طريقة تحميل الفيديوهات من الإنترنت:*\n` +
                             `• اكتب كلمة *فيديو* متبوعة باسم المقطع.\n\n` +
                             `📌 *مثال للاستخدام:*\n` +
                             `• فيديو غيبيمارو\n` +
                             `• فيديو قرآن كريم قصير\n\n` +
                             `✨ البوت يبحث تلقائياً في السيرفرات ويرسل المقطع مباشرة!`;
            await sock.sendMessage(from, { text: menuText }, { quoted: msg });
            return;
        }

        // 2. معالج البحث عن الفيديوهات وإرسالها بالاسم
        if (text.startsWith('فيديو ') || text.startsWith('.فيديو ')) {
            const query = text.replace(/^(\.فيديو|فيديو)\s+/, '');
            
            if (!query) {
                await sock.sendMessage(from, { text: '❌ يرجى كتابة اسم الفيديو بعد الأمر. مثال:\n*فيديو غيبيمارو*' }, { quoted: msg });
                return;
            }

            await sock.sendMessage(from, { text: `⏳ جاري البحث عن "${query}" عبر السيرفرات المتطورة...` }, { quoted: msg });

            // مصفوفة تحتوي على 3 سيرفرات مختلفة (إذا فشل سيرفر ينتقل للثاني تلقائياً)
            const apis = [
                `https://cafirexos.com{encodeURIComponent(query)}`,
                `https://dorratz.com{encodeURIComponent(query)}`,
                `https://vreden.web.id{encodeURIComponent(query)}`
            ];

            let success = false;

            for (const apiOfUrl of apis) {
                if (success) break;
                try {
                    const response = await axios.get(apiOfUrl);
                    let videoUrl = "";
                    let title = query;

                    // فحص هيكلية بيانات السيرفر الأول
                    if (response.data?.resultado?.video) {
                        videoUrl = response.data.resultado.video;
                        title = response.data.resultado.titulo || query;
                    } 
                    // فحص هيكلية بيانات السيرفر الثاني
                    else if (response.data?.result?.video?.url) {
                        videoUrl = response.data.result.video.url;
                    }
                    // فحص هيكلية بيانات السيرفر الثالث
                    else if (response.data?.result?.video) {
                        videoUrl = response.data.result.video;
                        title = response.data.result.title || query;
                    }

                    if (videoUrl) {
                        await sock.sendMessage(from, { 
                            video: { url: videoUrl }, 
                            caption: `🎬 *تم التحميل بنجاح:*\n📌 *العنوان:* ${title}\n\n✨ بواسطة بوت كاكاشي المطور` 
                        }, { quoted: msg });
                        success = true;
                        break;
                    }
                } catch (e) {
                    console.log("تخطي السيرفر بسبب توقفه المؤقت والتحول للبديل...");
                }
            }

            if (!success) {
                await sock.sendMessage(from, { text: '❌ عذراً، جميع سيرفرات جلب الفيديوهات مضغوطة حالياً. يرجى إعادة المحاولة بعد دقيقة أو تغيير اسم البحث.' }, { quoted: msg });
            }
        }
    });

    // إدارة توليد كود الربط الرقمي عند الحاجة
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925";
        console.log('⏳ جاري تهيئة الاتصال لطلب كود الربط الرقمي...');
        await delay(10000);
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log('\n=========================================');
            console.log(`🔥 كود الربط الخاص بك هو: ${code}`);
            console.log('=========================================\n');
        } catch (error) {
            console.error('❌ خطأ في طلب الكود:', error.message);
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🎉 تم تشغيل البوت بنجاح من التحديث الأخير لـ GitHub!');
        }
    });
}

startBot();
            
