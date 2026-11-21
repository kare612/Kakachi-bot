module.exports = {
    name: 'link',
    aliases: ['رابط'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        const code = await sock.groupInviteCode(remoteJid);
        await sock.sendMessage(remoteJid, { text: `🔗 *رابط بوابة المجموعة:*\nhttps://whatsapp.com{code}` }, { quoted: m });
    }
};
