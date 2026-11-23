const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

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
            // 1. البحث عن فيديوهات تصميم قصيرة عبر yt-search
            const search = await yts(`${query} edit amv shorts`);
            const videos = search.videos.filter(v => v.seconds > 5 && v.seconds <= 60);

            if (!videos || videos.length === 0) {
                return sock.sendMessage(
                    remoteJid,
                    { text: `❌ لم يتم العثور على تصاميم لـ: ${query}` },
                    { quoted: m }
                );
            }

            const pick = videos[Math.floor(Math.random() * Math.min(videos.length, 6))];

            // 2. استخراج رابط الفيديو المباشر محلياً داخل السيرفر (بدون مواقع خارجية)
            const info = await ytdl.getInfo(pick.url);
            const format = ytdl.chooseFormat(info.formats, { quality: '18' }) || 
                           info.formats.find(f => f.hasVideo && f.hasAudio && f.container === 'mp4');

            if (!format || !format.url) {
                throw new Error('تعذر إيجاد صيغة MP4 مناسبة لهذا الفيديو');
            }

            // تحميل الفيديو كـ Buffer خفيف وإرساله مباشرة لواتساب
            const chunks = [];
            const stream = ytdl.downloadFromInfo(info, { format });
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const videoBuffer = Buffer.concat(chunks);

            await sock.sendMessage(
                remoteJid,
                {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
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
