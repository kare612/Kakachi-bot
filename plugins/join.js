module.exports = {
    name: 'join',
    aliases: ['دخول', 'انضمام'],
    async execute(sock, m, args, remoteJid) {
        const sender = m.key.participantAlt || m.key.participant || remoteJid;
        const botNumber = sock.user?.id?.split(':')[0];
        const isOwner = sender.includes('212715469251') || (botNumber && sender.includes(botNumber)) || m.key.fromMe;

        if (!isOwner) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        const link = args[0];
        if (!link || !link.includes('://whatsapp.com')) return sock.sendMessage(remoteJid, { text: '❌ أرسل رابط المجموعة بعد الأمر.' }, { quoted: m });

        const code = link.split('://whatsapp.com')[1].split('?')[0];
        await sock.groupAcceptInvite(code);
        await sock.sendMessage(remoteJid, { text: `🌑 *تم اقتحام المجموعة بنجاح.*` }, { quoted: m });
    }
};
