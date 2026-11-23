const yts = require('yt-search');
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
            // 1. البحث عن فيديوهات تصميم قصيرة (Shorts / Edits) عبر yt-search
            const search = await yts(`${query} edit amv shorts`);
            const videos = search.videos.filter(v => v.seconds > 5 && v.seconds <= 90);

            if (!videos || videos.length === 0) {
                return sock.sendMessage(
                    remoteJid,
                    { text: `❌ لم يتم العثور على تصاميم لـ: ${query}` },
                    { quoted: m }
                );
            }

            const pick = videos[Math.floor(Math.random() * Math.min(videos.length, 8))];
            let videoUrl = null;

            // 2. جلب رابط التحميل المباشر من مصادر API مستقرة
            const apis = [
                `https://delirius.store{encodeURIComponent(pick.url)}`,
                `https://ryzendesu.vip{encodeURIComponent(pick.url)}`,
                `https://vreden.my.id{encodeURIComponent(pick.url)}`
            ];

            for (const api of apis) {
                try {
                    const res = await axios.get(api, { timeout: 15000 });
                    videoUrl = res.data?.data?.download?.url || res.data?.url || res.data?.result?.download?.url || res.data?.data?.url;
                    if (videoUrl) break;
                } catch (_) {}
            }

            if (!videoUrl) {
                throw new Error('تعذر استخراج رابط الفيديو من السيرفرات حالياً');
            }

            await sock.sendMessage(
                remoteJid,
                {
                    video: { url: videoUrl },
                    caption: `✨ *تم سحب التصميم بنجاح!*\n📌 *العنوان:* ${pick.title}\n⏱️ *المدة:* ${pick.timestamp}`
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
      
