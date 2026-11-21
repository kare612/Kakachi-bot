module.exports = {
    name: 'tiktok',
    aliases: ['تيك_توك', 'tt'],
    async execute(sock, m, args, remoteJid) {
        const link = args;
        if (!link || !link.includes('tiktok.com')) {
            return sock.sendMessage(remoteJid, { text: '❌ ضع رابط فيديو تيك توك بعد الأمر. مثال: `.tiktok https://tiktok.com...`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🦇 *جاري سحب الفيديو من تيك توك...*' }, { quoted: m });

        try {
            const url = 'https://tikwm.com' + encodeURIComponent(link);
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36' }
            });
            const json = await res.json();

            if (!json?.data?.play) throw new Error('لم يتم العثور على الفيديو');
            const videoUrl = json.data.play;

            await sock.sendMessage(
                remoteJid,
                { video: { url: videoUrl }, caption: `🌑 *${json.data.title || 'تم التحميل من تيك توك'}*` },
                { quoted: m }
            );
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: `❌ تعذر تحميل الفيديو: ${err.message}` }, { quoted: m });
        }
    }
};
