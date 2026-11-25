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
            { text: `🎬 *جاري البحث عن تصميم تيك توك لـ:* ${query}...` },
            { quoted: m }
        );

        try {
            // 1. البحث في تيك توك عبر API مجاني بدون مفتاح
            const searchQuery = encodeURIComponent(`${query} edit`);
            const apiUrl = `https://tikwm.com{searchQuery}&count=15&cursor=0&HD=1`;

            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const json = await response.json();

            if (!json || json.code !== 0 || !json.data || !json.data.videos || json.data.videos.length === 0) {
                throw new Error('لم يتم العثور على تصاميم في تيك توك لهذا الاسم');
            }

            // 2. اختيار فيديو عشوائي من النتائج (تصفية الفيديوهات المناسبة للواتساب)
            const validVideos = json.data.videos.filter(v => v.play && v.duration > 3 && v.duration <= 60);
            const list = validVideos.length > 0 ? validVideos : json.data.videos;
            const pick = list[Math.floor(Math.random() * list.length)];

            // رابط الفيديو المباشر بدون علامة مائية
            const videoUrl = pick.play.startsWith('http') ? pick.play : `https://tikwm.com${pick.play}`;

            // 3. إرسال الفيديو مباشرة للواتساب
            await sock.sendMessage(
                remoteJid,
                {
                    video: { url: videoUrl },
                    mimetype: 'video/mp4',
                    caption: `✨ *تصميم تيك توك (TikTok Edit)*\n👤 *المصمم:* ${pick.author?.nickname || 'غير معروف'}\n📌 *الوصف:* ${pick.title ? pick.title.slice(0, 100) : query}\n⏱️ *المدة:* ${pick.duration} ثانية`
                },
                { quoted: m }
            );

        } catch (e) {
            await sock.sendMessage(
                remoteJid,
                { text: `❌ تعذر جلب التصميم: ${e.message}` },
                { quoted: m }
            );
        }
    }
};
