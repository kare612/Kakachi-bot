module.exports = {
    name: 'tiktokedit',
    aliases: ['ايديت_تيكتوك', 'تصاميم', 'تصميم', 'ttedit'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(
                remoteJid,
                { text: '❌ اكتب اسم الشخصية أو نوع التصميم بعد الأمر.\nمثال: `.تصميم naruto edit` أو `.تصميم سولو ليفلينج`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: `🎬 *جاري البحث وسحب تصميم تيك توك لـ:* ${query}...` }, { quoted: m });

        try {
            const searchQuery = `${query} edit 4k`;
            const api = new URL('https://tikwm.com');
            api.searchParams.set('keywords', searchQuery);
            api.searchParams.set('count', '10');
            api.searchParams.set('cursor', '0');

            const res = await fetch(api.href, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36'
                }
            });

            const json = await res.json();
            const videos = json?.data?.videos || [];

            if (videos.length === 0) {
                return await sock.sendMessage(
                    remoteJid,
                    { text: `❌ لم يتم العثور على تصاميم تطابق (${query})، جرب كتابة الاسم بالإنجليزية.` },
                    { quoted: m }
                );
            }

            // اختيار تصميم عشوائي من أعلى 10 نتائج لتجديد الفيديوهات في كل مرة تطلب فيها
            const chosen = videos.at(Math.floor(Math.random() * videos.length));
            const videoUrl = chosen.play || chosen.wmplay;

            if (!videoUrl) throw new Error('تعذر استخراج رابط الفيديو');

            const videoRes = await fetch(videoUrl);
            if (!videoRes.ok) throw new Error('فشل تحميل مقطع التصميم');
            const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

            const caption = `🌑 *تـصـمـيـم تـيـك تـوك جاهز* 🎬\n\n` +
                            `📝 *العنوان:* ${chosen.title || query}\n` +
                            `👤 *المصمم:* ${chosen.author?.nickname || 'غير معروف'}\n` +
                            `❤️ *الإعجابات:* ${chosen.digg_count || 0}`;

            await sock.sendMessage(
                remoteJid,
                {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption
                },
                { quoted: m }
            );
        } catch (err) {
            await sock.sendMessage(
                remoteJid,
                { text: `❌ تعذر جلب التصميم حالياً (${err.message}).` },
                { quoted: m }
            );
        }
    }
};
