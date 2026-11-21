module.exports = {
    name: 'leave',
    aliases: ['خروج', 'مغادرة'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return;
        const sender = m.key.participant || remoteJid;
        if (!sender.includes('212715469251') && !m.key.fromMe) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        await sock.sendMessage(remoteJid, { text: `🕯️ *الظلال تغادر هذا المكان... وداعاً.*` });
        await sock.groupLeave(remoteJid);
    }
};
