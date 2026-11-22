module.exports = {
    name: 'restart',
    aliases: ['اعادة_تشغيل', 'ريستارت'],
    async execute(sock, m, args, remoteJid) {
        const sender = m.key.participant || m.key.participantAlt || remoteJid;
        const isOwner = ['212715469251', '68531186057376'].some(id => sender.includes(id)) || m.key.fromMe;
        if (!isOwner) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        await sock.sendMessage(remoteJid, { text: '🔄 *جاري إعادة إحياء البوت في الظلام...*' }, { quoted: m });
        setTimeout(() => process.exit(0), 1500);
    }
};
