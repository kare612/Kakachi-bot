const axios = require('axios');

module.exports = {
    command: ['تصميم', 'اديت'],
    async execute(sock, msg, args, text) {
        const from = msg.key.remoteJid;
        const query = args.join(' ') || text;

        if (!query) {
            return sock.sendMessage(from, { text: '⚠️ اكتب اسم الشخصية أو التصميم بعد الأمر.\nمثال: *.تصميم كاكاشي*' }, { quoted: msg });
        }

        await sock.sendMessage(from, { text: `🎬 *جاري البحث وسحب تصميم لـ:* ${query}...` }, { quoted: msg });

        try {
            // البحث في تيك توك عبر API مجاني بدون الحاجة لـ yt-dlp
            const searchQuery = encodeURIComponent(`${query} edit amv`);
            const res = await axios.get(`https://tikwm.com{searchQuery}&count=10`);

            const videos = res.data?.data?.videos;
            if (!videos || videos.length === 0) {
                return sock.sendMessage(from, { text: '❌ لم يتم العثور على تصاميم لهذا الاسم.' }, { quoted: msg });
            }

            // اختيار فيديو عشوائي من النتائج
            const randomVideo = videos[Math.floor(Math.random() * videos.length)];
            const videoUrl = randomVideo.play; // رابط الفيديو بدون علامة مائية

            await sock.sendMessage(from, {
                video: { url: videoUrl },
                caption: `✨ *تم سحب التصميم بنجاح!*\n📌 *البحث:* ${query}`
            }, { quoted: msg });

        } catch (error) {
            console.error(error);
            await sock.sendMessage(from, { text: '❌ حدث خطأ أثناء جلب الفيديو، حاول مرة أخرى.' }, { quoted: msg });
        }
    }
};
