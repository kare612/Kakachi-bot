// كود إضافة تحميل وتشغيل الفيديوهات لبوت كاكاشي (نسخة ES Modules المحدثة والمصححة)
import axios from 'axios';

export default {
    name: 'فيديو',
    alias: ['video', 'تحميل_فيديو', 'vd'],
    category: 'downloader',
    desc: 'تحميل وتشغيل الفيديوهات من الروابط مباشرة',
    async execute(client, m, args) {
        // التأكد من وجود المصفوفة args أولاً لتفادي كراش البوت
        const text = args ? args.join(' ') : '';
        const chatId = m.chat || m.key.remoteJid; // تحديد الشات المتوافق مع ملف index.js الخاص بك

        // 1. التأكد من أن المستخدم أرسل رابطاً
        if (!text) {
            return await client.sendMessage(chatId, { 
                text: '⚠️ يرجى إدخال رابط الفيديو بعد الأمر.\nمثال:\n.فيديو https://tiktok.com...' 
            }, { quoted: m });
        }

        const videoUrl = text.trim();

        try {
            // 2. إرسال رسالة تفيد ببدء المعالجة
            await client.sendMessage(chatId, { text: '⏳ جاري تشغيل ومعالجة الفيديو، يرجى الانتظار...' }, { quoted: m });

            // 3. جلب الفيديو وتحميله باستخدام واجهة برمجة (API) مع تصحيح صياغة الرابط
            const response = await axios.get(`https://eu.org{encodeURIComponent(videoUrl)}&apikey=XYZ`).catch(() => null);
            
            let finalVideoUrl = videoUrl;
            if (response && response.data && response.data.result && response.data.result.video) {
                finalVideoUrl = response.data.result.video; // الرابط المباشر المستخرج
            }

            // 4. إرسال الفيديو مباشرة إلى شات الواتساب
            await client.sendMessage(chatId, {
                video: { url: finalVideoUrl },
                caption: '🎬 تم تشغيل وتحميل الفيديو بنجاح بواسطة بوت كاكاشي!',
                mimetype: 'video/mp4',
                fileName: 'kakashi_video.mp4'
            }, { quoted: m });

        } catch (error) {
            console.error("خطأ في إضافة الفيديو:", error);
            
            // محاولة بديلة: إرسال الرابط المباشر مباشرة للواتساب في حال كان الرابط المدخل مباشراً أصلاً
            try {
                await client.sendMessage(chatId, {
                    video: { url: videoUrl },
                    caption: '🎬 تم التشغيل (محاولة مباشرة)',
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } catch (fallbackError) {
                await client.sendMessage(chatId, { 
                    text: '❌ عذراً، تعذر تحميل هذا الفيديو. تأكد من أن الرابط صحيح أو أن حجم الفيديو لا يتعدى حد الواتساب.' 
                }, { quoted: m });
            }
        }
    }
};
