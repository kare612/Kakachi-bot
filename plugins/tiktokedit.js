const axios = require('axios');

module.exports = {
    name: 'tiktokedit',
    aliases: ['تصميم', 'تصاميم', 'اديت', 'ttedit'],
    command: ['تصميم', 'تصاميم', 'اديت'],
    async execute(sock, m, args, remoteJid) {
        const query = Array.isArray(args) ? args.join(' ').trim() : '';
        if (!query) {
            return sock.sendMessage(
                remoteJid,
                { text: '❌ اكتب اسم الشخصية أو التصميم بعد الأمر.\nمثال: *.تصميم كاكاشي*' },
                { quoted: m }
            );
        }

        await sock.sendMessage(
            remoteJid,
            { text: `🎬 *جاري سحب تصميم لـ:* ${query}...` },
            { quoted: m }
        );

        try {
            const tags = ['edit', 'amv', 'twixtor'];
            const randomTag = tags[Math.floor(Math.random() * tags.length)];
            const searchQuery = encodeURIComponent(`${query} ${randomTag}`);

            const apiUrl = 'https://tikwm.com' + searchQuery + '&count=10';
            const res = await axios.get(apiUrl);
            const videos = res.data?.data?.videos;

            if (!videos || videos.length === 0) {
                return sock.sendMessage(
                    remoteJid,
                    { text: `❌ لم يتم العثور على تصميم لـ: ${query}` },
                    { quoted: m }
                );
            }

            const pick = videos[Math.floor(Math.random() * videos.length)];
            let videoUrl = pick.play || pick.wmplay;

            // إكمال الرابط إذا كان نسبياً لتجنب خطأ Invalid URL
            if (videoUrl && !videoUrl.startsWith('http')) {
                videoUrl = 'https://tikwm.com' + videoUrl;
            }

            if (!videoUrl) {
                throw new Error('لم يتم العثور على رابط مباشر للفيديو');
            }

            await sock.sendMessage(
                remoteJid,
                {
                    video: { url: videoUrl },
                    caption: `✨ *تم سحب التصميم بنجاح!*\n📌 *الشخصية:* ${query}`
                },
                { quoted: m }
            );
        } catch (e) {
            await sock.sendMessage(
                remoteJid,
                { text: `❌ تعذر سحب التصميم: ${e.message}` },
                { quoted: m }
            );
        }
    }
};
