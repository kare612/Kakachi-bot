module.exports = {
    name: 'wiki',
    aliases: ['ويكيبيديا', 'موسوعة'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) return sock.sendMessage(remoteJid, { text: '❌ اكتب الكلمة التي تبحث عنها. مثال: `.wiki المغرب`' }, { quoted: m });

        try {
            const url = `https://wikipedia.org{encodeURIComponent(query)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data.extract) return sock.sendMessage(remoteJid, { text: '❌ لم يتم العثور على نتيجة في ويكيبيديا.' }, { quoted: m });

            await sock.sendMessage(remoteJid, { text: `📚 *نتائج ويكيبيديا حول (${data.title}):*\n\n${data.extract}` }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء البحث.' }, { quoted: m });
        }
    }
};
