module.exports = {
    name: 'google',
    aliases: ['جوجل', 'بحث'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) return sock.sendMessage(remoteJid, { text: '❌ اكتب ما تريد البحث عنه. مثال: `.google أسود الأطلس`' }, { quoted: m });

        const searchUrl = new URL('https://google.com');
        searchUrl.searchParams.set('q', query);

        await sock.sendMessage(
            remoteJid,
            { text: `🔍 *نتائج البحث عن (${query}):*\n\n🌐 اضغط على الرابط لفتح النتائج مباشرة:\n${searchUrl.href}` },
            { quoted: m }
        );
    }
};
