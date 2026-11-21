module.exports = {
    name: 'groupinfo',
    aliases: ['معلومات_المجموعة', 'قروب'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        const meta = await sock.groupMetadata(remoteJid);
        const admins = meta.participants.filter(p => p.admin).length;
        const text = `🕸️ *بـطـاقـة الـمـجـمـوعـة:*\n\n` +
                     `🏷️ *الاسم:* ${meta.subject}\n` +
                     `👥 *عدد الأعضاء:* ${meta.participants.length}\n` +
                     `👑 *عدد المشرفين:* ${admins}\n` +
                     `📜 *الوصف:*\n${meta.desc || 'لا يوجد وصف'}`;

        await sock.sendMessage(remoteJid, { text }, { quoted: m });
    }
};
