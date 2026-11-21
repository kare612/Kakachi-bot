module.exports = {
    name: 'antilink',
    aliases: ['منع_الروابط', 'مضاد_الروابط'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        global.antiLinkGroups = global.antiLinkGroups || {};
        const option = args.at(0)?.toLowerCase();

        if (option === 'on' || option === 'تفعيل') {
            global.antiLinkGroups[remoteJid] = true;
            return sock.sendMessage(remoteJid, { text: '🛡️ *تم تفعيل درع منع الروابط في هذه المجموعة.*' }, { quoted: m });
        } else if (option === 'off' || option === 'ايقاف') {
            global.antiLinkGroups[remoteJid] = false;
            return sock.sendMessage(remoteJid, { text: '🔓 *تم إيقاف منع الروابط.*' }, { quoted: m });
        } else {
            return sock.sendMessage(remoteJid, { text: '⚙️ اكتب `.antilink تفعيل` أو `.antilink ايقاف`' }, { quoted: m });
        }
    }
};
