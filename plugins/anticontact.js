module.exports = {
    name: 'anticontact',
    aliases: ['منع_الارقام', 'منع_الجهات', 'مضاد_الارقام'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) {
            return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });
        }

        global.antiContactGroups = global.antiContactGroups || {};
        const option = args[0]?.toLowerCase();

        if (option === 'on' || option === 'تفعيل') {
            global.antiContactGroups[remoteJid] = true;
            return sock.sendMessage(remoteJid, { text: '🛡️ *تم تفعيل درع منع إرسال جهات الاتصال والأرقام في هذه المجموعة.*' }, { quoted: m });
        } else if (option === 'off' || option === 'ايقاف') {
            global.antiContactGroups[remoteJid] = false;
            return sock.sendMessage(remoteJid, { text: '🔓 *تم إيقاف منع جهات الاتصال والأرقام.*' }, { quoted: m });
        } else {
            return sock.sendMessage(remoteJid, { text: '⚙️ اكتب `.anticontact تفعيل` أو `.anticontact ايقاف`' }, { quoted: m });
        }
    }
};
