// كود إضافة تحميل وتشغيل الفيديوهات لبوت كاكاشي
const axios = require('axios');

module.exports = {
    name: 'فيديو',
    alias: ['video', 'تحميل_فيديو', 'vd'],
    category: 'downloader',
    desc: 'تحميل وتشغيل الفيديوهات من الروابط مباشرة',
    async execute(client, m, { text, args }) {
        // 1. التأكد من أن المستخدم أرسل رابطاً
        if (!text) {
            return await client.sendMessage(m.chat, { 
                text: '⚠️ يرجى إدخال رابط الفيديو بعد الأمر.\nمثال:\n.فيديو https://tiktok.com...' 
            }, { quoted: m });
        }

        const videoUrl = text.trim();

        try {
            // 2. إرسال رسالة تفيد ببدء المعالجة
            await client.sendMessage(m.chat, { text: '⏳ جاري تشغيل ومعالجة الفيديو، يرجى الانتظار...' }, { quoted: m });

            // 3. جلب الفيديو وتحميله باستخدام واجهة برمجة (API) مجانية للتحميل
            // نستخدم هنا API عام ومستقر لتحويل ميديا التيك توك والمنصات الأخرى إلى روابط مباشرة
            const response = await axios.get(`https://eu.org{encodeURIComponent(videoUrl)}&apikey=XYZ`);
            
            // ملاحظة: يمكنك استبدال الرابط أعلاه بأي موقع API تحميل تفضله أو إرسال الرابط مباشرة إذا كان رابطاً ينتهي بـ .mp4
            let finalVideoUrl = videoUrl;
            if (response.data && response.data.result && response.data.result.video) {
                finalVideoUrl = response.data.result.video; // الرابط المباشر المستخرج
            }

            // 4. إرسال الفيديو مباشرة إلى شات الواتساب
            await client.sendMessage(m.chat, {
                video: { url: finalVideoUrl },
                caption: '🎬 تم تشغيل وتحميل الفيديو بنجاح بواسطة بوت كاكاشي!',
                mimetype: 'video/mp4',
                fileName: 'kakashi_video.mp4'
            }, { quoted: m });

        } catch (error) {
            console.error("خطأ في إضافة الفيديو:", error);
            
            // محاولة بديلة: إرسال الرابط المباشر مباشرة للواتساب في حال كان الرابط المدخل مباشراً أصلاً
            try {
                await client.sendMessage(m.chat, {
                    video: { url: videoUrl },
                    caption: '🎬 تم التشغيل (محاولة مباشرة)',
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } catch (fallbackError) {
                await client.sendMessage(m.chat, { 
                    text: '❌ عذراً، تعذر تحميل هذا الفيديو. تأكد من أن الرابط صحيح أو أن حجم الفيديو لا يتعدى حد الواتساب.' 
                }, { quoted: m });
            }
        }
    }
};
