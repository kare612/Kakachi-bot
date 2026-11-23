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

            const apiUrl = 'https://tikwm.com' + '/api/feed/search?keywords=' + searchQuery + '&count=10';
            
            // إضافة ترويسات متصفح حقيقية لتجاوز حظر 403
            const res = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Referer': 'https://tikwm.com/'
                }
            });

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

            if (videoUrl && !videoUrl.startsWith('http')) {
                videoUrl = 'https://tikwm.com' + videoUrl;
            }

            // تحميل الفيديو كـ Buffer مع ترويسة المتصفح لضمان عدم حظر 403 عند التحميل
            const videoRes = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://tikwm.com/'
                }
            });

            await sock.sendMessage(
                remoteJid,
                {
                    video: Buffer.from(videoRes.data),
                    mimetype: 'video/mp4',
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
