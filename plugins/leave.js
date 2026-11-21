module.exports = {
    name: 'leave',
    aliases: ['خروج', 'مغادرة'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return;
        const sender = m.key.participantAlt || m.key.participant || remoteJid;
        const botNumber = sock.user?.id?.split(':')[0];
        const isOwner = sender.includes('212715469251') || (botNumber && sender.includes(botNumber)) || m.key.fromMe;

        if (!isOwner) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        await sock.sendMessage(remoteJid, { text: `🕯️ *الظلال تغادر هذا المكان... وداعاً.*` });
        await sock.groupLeave(remoteJid);
    }
};
