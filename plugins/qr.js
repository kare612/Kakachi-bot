module.exports = {
    name: 'qr',
    aliases: ['باركود', 'كيو_ار'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص أو الرابط الذي تريد تحويله إلى QR.' }, { quoted: m });

        const qrUrl = `https://qrserver.com{encodeURIComponent(text)}`;
        await sock.sendMessage(remoteJid, { image: { url: qrUrl }, caption: `🔲 *تم تشفير النص في رمز الظلام.*` }, { quoted: m });
    }
};
