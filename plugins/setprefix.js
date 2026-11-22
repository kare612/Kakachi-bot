module.exports = {
    name: 'setprefix',
    aliases: ['البادئة', 'تغيير_الرمز'],
    async execute(sock, m, args, remoteJid) {
        const sender = m.key.participant || m.key.participantAlt || remoteJid;
        const isOwner = ['212715469251', '68531186057376'].some(id => sender.includes(id)) || m.key.fromMe;
        if (!isOwner) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        const newPrefix = args.at(0);
        if (!newPrefix || newPrefix.length > 2) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب الرمز الجديد (حرف أو رمز واحد). مثال: `.setprefix !`' }, { quoted: m });
        }

        global.botPrefix = newPrefix;
        await sock.sendMessage(remoteJid, { text: `⚡ *تم تحديث بادئة الأوامر إلى:* ( ${newPrefix} )` }, { quoted: m });
    }
};
