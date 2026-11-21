module.exports = {
    name: 'short',
    aliases: ['اختصار'],
    async execute(sock, m, args, remoteJid) {
        const link = args.at(0);
        if (!link || !link.startsWith('http')) {
            return sock.sendMessage(remoteJid, { text: '❌ ضع رابطاً صحيحاً يبدأ بـ http أو https.' }, { quoted: m });
        }

        try {
            const api = new URL('https://tinyurl.com');
            api.searchParams.set('url', link);

            const res = await fetch(api.href);
            const shortUrl = await res.text();
            await sock.sendMessage(remoteJid, { text: `🔗 *تم اختصار الرابط بنجاح:*\n${shortUrl}` }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر اختصار الرابط حالياً.' }, { quoted: m });
        }
    }
};
