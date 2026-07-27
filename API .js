// إضافة ميزة تحميل وتشغيل الفيديوهات داخل ملف الإضافات
module.exports = {
    name: 'فيديو',
    alias: ['video', 'تحميل'],
    category: 'downloader',
    desc: 'تحميل وتشغيل الفيديوهات من الروابط مباشرة',
    async execute(client, m, { args }) {
        // 1. التحقق من أن المستخدم أرسل رابطاً
        if (!args[0]) {
            return await client.sendMessage(m.chat, { text: '⚠️ يرجى إدخال رابط الفيديو بعد الأمر. مثال:\n.فيديو [رابط الفيديو]' }, { quoted: m });
        }

        const videoUrl = args[0];

        try {
            // 2. إرسال رسالة انتظار للمستخدم
            await client.sendMessage(m.chat, { text: '⏳ جاري تشغيل ومعالجة الفيديو عبر Termux، يرجى الانتظار...' }, { quoted: m });

            // 3. إرسال الفيديو مباشرة إلى الواتساب كملف MP4
            await client.sendMessage(m.chat, {
                video: { url: videoUrl },
                caption: '🎬 تم تحميل وتشغيل الفيديو بنجاح بواسطة بوت كاكاشي!',
                mimetype: 'video/mp4',
                fileName: 'kakashi_video.mp4'
            }, { quoted: m });

        } catch (error) {
            console.error("خطأ في تشغيل الفيديو:", error);
            await client.sendMessage(m.chat, { text: '❌ عذراً، تعذر تشغيل الفيديو. تأكد من أن الرابط مباشر وحجم الملف مناسب.' }, { quoted: m });
        }
    }
};
