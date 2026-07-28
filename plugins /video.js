// كود ميزة تحميل وتشغيل الفيديوهات المصلح كلياً لمنع الكراش
module.exports = {
    name: 'فيديو',
    alias: ['video', 'تحميل', 'تحميل_فيديو'],
    category: 'downloader',
    desc: 'تحميل وتشغيل الفيديوهات من الروابط مباشرة',
    async execute(client, m, args) {
        try {
            // التحقق الذكي من وجود المصفوفة والنص لعدم إلقاء خطأ 'undefined (reading 0)'
            const text = args && Array.isArray(args) ? args.join(' ') : '';
            const messageObj = m.message ? m : (Array.isArray(m) ? m[0] : m);
            if (!messageObj) return;

            const chatId = m.chat || messageObj.key.remoteJid;

            // 1. التحقق من أن المستخدم أرسل رابطاً
            if (!text || text.trim() === '') {
                return await client.sendMessage(chatId, { text: '⚠️ يرجى إدخال رابط الفيديو بعد الأمر. مثال:\n.فيديو [رابط الفيديو]' }, { quoted: messageObj });
            }

            const videoUrl = text.trim();

            // 2. إرسال رسالة انتظار للمستخدم
            await client.sendMessage(chatId, { text: '⏳ جاري تشغيل ومعالجة الفيديو، يرجى الانتظار...' }, { quoted: messageObj });

            // 3. إرسال الفيديو مباشرة إلى الواتساب كملف MP4
            await client.sendMessage(chatId, {
                video: { url: videoUrl },
                caption: '🎬 تم تحميل وتشغيل الفيديو بنجاح بواسطة بوت كاكاشي!',
                mimetype: 'video/mp4',
                fileName: 'kakashi_video.mp4'
            }, { quoted: messageObj });

        } catch (error) {
            console.error("خطأ في تشغيل الفيديو:", error);
            const messageObj = m.message ? m : (Array.isArray(m) ? m[0] : m);
            if (messageObj) {
                const chatId = m.chat || messageObj.key.remoteJid;
                await client.sendMessage(chatId, { text: '❌ عذراً، تعذر تشغيل الفيديو. تأكد من أن الرابط مباشر وحجم الملف مناسب للواتساب.' }, { quoted: messageObj });
            }
        }
    }
};
