module.exports = {
    name: 'setdesc',
    aliases: ['وصف', 'تغيير_الوصف'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });
        const newDesc = args.join(' ');
        if (!newDesc) return sock.sendMessage(remoteJid, { text: '❌ اكتب الوصف الجديد بعد الأمر.' }, { quoted: m });

        await sock.groupUpdateDescription(remoteJid, newDesc);
        await sock.sendMessage(remoteJid, { text: `📜 *تم تحديث قوانين ووصف المجموعة بنجاح.*` }, { quoted: m });
    }
};
