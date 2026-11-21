module.exports = {
    name: 'join',
    aliases: ['دخول', 'انضمام'],
    async execute(sock, m, args, remoteJid) {
        const sender = m.key.participant || m.key.participantAlt || remoteJid;
        const isOwner = ['212715469251', '68531186057376'].some(id => sender.includes(id)) || m.key.fromMe;

        if (!isOwner) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        const link = args[0];
        if (!link || !link.includes('://whatsapp.com')) return sock.sendMessage(remoteJid, { text: '❌ أرسل رابط المجموعة بعد الأمر.' }, { quoted: m });

        const code = link.split('://whatsapp.com')[1].split('?')[0];
        await sock.groupAcceptInvite(code);
        await sock.sendMessage(remoteJid, { text: `🌑 *تم اقتحام المجموعة بنجاح.*` }, { quoted: m });
    }
};
