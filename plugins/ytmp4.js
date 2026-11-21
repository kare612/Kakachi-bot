module.exports = {
    name: 'ytmp4',
    aliases: ['video', 'فيديو'],
    async execute(sock, m, args, remoteJid) {
        const link = args.at(0);
        if (!link || !link.startsWith('http')) {
            return sock.sendMessage(remoteJid, { text: '❌ ضع رابط الفيديو بعد الأمر. مثال: `.video https://youtu.be...`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🎬 *جاري سحب الفيديو...*' }, { quoted: m });

        try {
            const url = 'https://siputzx.my.id' + encodeURIComponent(link);
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36' }
            });
            const json = await res.json();

            const videoUrl = json?.data?.dl || json?.data?.url;
            if (!videoUrl) throw new Error('لم يتم العثور على رابط مباشر للفيديو');

            await sock.sendMessage(
                remoteJid,
                { video: { url: videoUrl }, caption: `🌑 *${json?.data?.title || 'تم التحميل بنجاح'}*` },
                { quoted: m }
            );
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: `❌ تعذر تحميل الفيديو: ${err.message}` }, { quoted: m });
        }
    }
};
                
