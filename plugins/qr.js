module.exports = {
    name: 'qr',
    aliases: ['باركود', 'كيو_ار'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص أو الرابط.' }, { quoted: m });

        const url = new URL('https://qrserver.com');
        url.searchParams.set('size', '500x500');
        url.searchParams.set('data', text);

        await sock.sendMessage(remoteJid, { image: { url: url.href }, caption: `🔲 *تم تشفير النص في رمز الظلام.*` }, { quoted: m });
    }
};
