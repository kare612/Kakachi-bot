module.exports = {
    name: 'reverse',
    aliases: ['عكس', 'اقلب'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص لعكسه. مثال: `.عكس كاكاشي`' }, { quoted: m });

        const reversed = text.split('').reverse().join('');
        await sock.sendMessage(remoteJid, { text: `🔄 *النص المعكوس:*\n\n${reversed}` }, { quoted: m });
    }
};
