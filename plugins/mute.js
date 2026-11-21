module.exports = {
    name: 'mute',
    aliases: ['قفل', 'اغلاق'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        await sock.groupSettingUpdate(remoteJid, 'announcement');
        await sock.sendMessage(remoteJid, { text: `🔒 *تم تكميم أفواه المجموعة، الكلام للمشرفين فقط.*` }, { quoted: m });
    }
};
