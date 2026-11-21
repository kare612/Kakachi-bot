module.exports = {
    name: 'unmute',
    aliases: ['فتح'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        await sock.groupSettingUpdate(remoteJid, 'not_announcement');
        await sock.sendMessage(remoteJid, { text: `🔓 *تم فك القيود، يمكن للجميع التحدث الآن.*` }, { quoted: m });
    }
};
