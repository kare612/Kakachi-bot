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

            let videoUrl = null;

            // المصدر الأول: Siputzx TikTok Search API (مفتوح للسيرفرات)
            try {
                const res1 = await axios.get(`https://siputzx.my.id{searchQuery}`, { timeout: 15000 });
                const list1 = res1.data?.data;
                if (Array.isArray(list1) && list1.length > 0) {
                    const pick = list1[Math.floor(Math.random() * list1.length)];
                    videoUrl = pick.play || pick.video || pick.nowm;
                }
            } catch (_) {}

            // المصدر الثاني (احتياطي): Vreden TikTok Search API
            if (!videoUrl) {
                try {
                    const res2 = await axios.get(`https://vreden.my.id{searchQuery}`, { timeout: 15000 });
                    const list2 = res2.data?.result;
                    if (Array.isArray(list2) && list2.length > 0) {
                        const pick = list2[Math.floor(Math.random() * list2.length)];
                        videoUrl = pick.play || pick.video || pick.url;
                    }
                } catch (_) {}
            }

            if (!videoUrl) {
                throw new Error('لم يتم العثور على رابط تصميم متاح حالياً');
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
