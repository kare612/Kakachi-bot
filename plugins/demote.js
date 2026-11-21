module.exports = {
    name: 'demote',
    aliases: ['تنزيل', 'سحب'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return sock.sendMessage(remoteJid, { text: '❌ منشن المشرف أو رد على رسالته لسحب إشرافه.' }, { quoted: m });

        await sock.groupParticipantsUpdate(remoteJid, [target], 'demote');
        await sock.sendMessage(remoteJid, { text: `⛓️ *تم تجريده من رتبة الإشراف.*` }, { quoted: m });
    }
};
