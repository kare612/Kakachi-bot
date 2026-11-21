module.exports = {
    name: 'revoke',
    aliases: ['تغيير_الرابط', 'تجديد'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        const newCode = await sock.groupRevokeInvite(remoteJid);
        await sock.sendMessage(remoteJid, { text: `⛓️ *تم تدمير الرابط القديم.*\n🔗 *الرابط الجديد:* https://whatsapp.com{newCode}` }, { quoted: m });
    }
};
