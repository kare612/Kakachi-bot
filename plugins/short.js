module.exports = {
    name: 'short',
    aliases: ['اختصار'],
    async execute(sock, m, args, remoteJid) {
        const url = args[0];
        if (!url || !url.startsWith('http')) return sock.sendMessage(remoteJid, { text: '❌ ضع رابطاً صحيحاً يبدأ بـ http أو https.' }, { quoted: m });

        try {
            const res = await fetch(`https://tinyurl.com{encodeURIComponent(url)}`);
            const shortUrl = await res.text();
            await sock.sendMessage(remoteJid, { text: `🔗 *تم اختصار الرابط بنجاح:*\n${shortUrl}` }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر اختصار الرابط.' }, { quoted: m });
        }
    }
};
                                   
