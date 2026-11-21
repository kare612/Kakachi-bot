module.exports = {
    name: 'setname',
    aliases: ['اسم_المجموعة', 'تغيير_الاسم'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });
        const newName = args.join(' ');
        if (!newName) return sock.sendMessage(remoteJid, { text: '❌ اكتب الاسم الجديد بعد الأمر.' }, { quoted: m });

        await sock.groupUpdateSubject(remoteJid, newName);
        await sock.sendMessage(remoteJid, { text: `🌑 *تم تغيير اسم المملكة إلى:* ${newName}` }, { quoted: m });
    }
};
