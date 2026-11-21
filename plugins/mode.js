module.exports = {
    name: 'mode',
    aliases: ['الوضع', 'خاص', 'عام'],
    async execute(sock, m, args, remoteJid) {
        const sender = m.key.participant || m.key.participantAlt || remoteJid;
        const isOwner = ['212715469251', '68531186057376'].some(id => sender.includes(id)) || m.key.fromMe;
        if (!isOwner) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        const choice = args[0]?.toLowerCase();
        if (choice === 'private' || choice === 'خاص') {
            global.botMode = 'private';
            return sock.sendMessage(remoteJid, { text: '🔒 *تم تفعيل الوضع الخاص (البوت يستجيب للمطور فقط).*' }, { quoted: m });
        } else if (choice === 'public' || choice === 'عام') {
            global.botMode = 'public';
            return sock.sendMessage(remoteJid, { text: '🔓 *تم تفعيل الوضع العام (البوت متاح للجميع).*' }, { quoted: m });
        } else {
            return sock.sendMessage(remoteJid, { text: '⚙️ اكتب `.mode خاص` أو `.mode عام`' }, { quoted: m });
        }
    }
};
