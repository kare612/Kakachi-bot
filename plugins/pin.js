module.exports = {
    name: 'pin',
    aliases: ['بنترست', 'pinterest'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب وصف الخلفية. مثال: `.pin dark anime wallpaper`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: `📌 *جاري جلب خلفية بنترست:* ${query}...` }, { quoted: m });

        try {
            const prompt = `aesthetic pinterest wallpaper, ${query}, high quality vertical photography`;
            const url = new URL('https://pollinations.ai' + encodeURIComponent(prompt));
            url.searchParams.set('nologo', 'true');
            url.searchParams.set('width', '720');
            url.searchParams.set('height', '1280');

            const res = await fetch(url.href, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36' }
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);

            const buffer = Buffer.from(await res.arrayBuffer());
            await sock.sendMessage(
                remoteJid,
                { image: buffer, caption: `📌 *خلفية بنترست:* ${query}` },
                { quoted: m }
            );
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر جلب الخلفية حالياً.' }, { quoted: m });
        }
    }
};
