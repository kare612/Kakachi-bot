import axios from 'axios';

export default {
    command: ['تنزيل', 'تحميل', 'تيك', 'انستا', 'dl', 'tiktok', 'ig'],
    category: 'download',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        const targetUrl = args?.join(' ') || args;

        if (!targetUrl || !targetUrl.startsWith('http')) {
            return await sock.sendMessage(chatJid, { 
                text: '⚠️ *تنبيه:* يرجى وضع رابط الفيديو (تيك توك، إنستغرام، فيسبوك) بعد الأمر!\n\n*مثال:* `.تنزيل رابط_الفيديو_هنا`' 
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatJid, { text: '🎬 *جاري سحب المقطع من السيرفر المباشر...*' }, { quoted: msg });

            // استخدام واجهة API شاملة مجانية لتنزيل الفيديوهات من كافة المنصات
            const apiUrl = `https://boxmineworld.com{encodeURIComponent(targetUrl)}`;
            
            const res = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(res.data, 'binary');

            // إرسال مقطع الفيديو المحمل تلقائياً للمستخدم
            await sock.sendMessage(chatJid, { 
                video: videoBuffer, 
                mimetype: 'video/mp4',
                caption: '✅ *تم التحميل بنجاح بواسطة بوت كاكاشي!*'
            }, { quoted: msg });

        } catch (error) {
            console.error("خطأ في ملف التنزيل:", error);
            await sock.sendMessage(chatJid, { 
                text: '❌ *عذراً:* فشل السيرفر في استخراج هذا المقطع، تأكد من أن حساب صاحب الفيديو ليس خاصاً (Private).' 
            }, { quoted: msg });
        }
    }
};
