module.exports = {
    name: 'leave',
    aliases: ['خروج', 'مغادرة'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return;
        const sender = m.key.participant || m.key.participantAlt || remoteJid;
        const isOwner = ['212715469251', '68531186057376'].some(id => sender.includes(id)) || m.key.fromMe;

        if (!isOwner) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        await sock.sendMessage(remoteJid, { text: `🕯️ *الظلال تغادر هذا المكان... وداعاً.*` });
        await sock.groupLeave(remoteJid);
    }
};
