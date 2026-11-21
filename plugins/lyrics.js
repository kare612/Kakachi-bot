module.exports = {
    name: 'lyrics',
    aliases: ['كلمات', 'كلمات_اغنية'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم الأغنية. مثال: `.lyrics Believer`' }, { quoted: m });

        try {
            const url = 'https://some-random-api.com' + encodeURIComponent(query);
            const res = await fetch(url);
            const data = await res.json();

            if (!data.lyrics) return sock.sendMessage(remoteJid, { text: '❌ لم يتم العثور على كلمات لهذه الأغنية.' }, { quoted: m });
            await sock.sendMessage(
                remoteJid,
                { text: `🎵 *${data.title}* - ${data.author}\n\n${data.lyrics}` },
                { quoted: m }
            );
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر جلب الكلمات حالياً.' }, { quoted: m });
        }
    }
};
