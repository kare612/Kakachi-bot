module.exports = {
    name: 'promote',
    aliases: ['ترقية', 'مشرف'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return sock.sendMessage(remoteJid, { text: '❌ منشن الشخص أو رد على رسالته لترقيته.' }, { quoted: m });

        await sock.groupParticipantsUpdate(remoteJid, [target], 'promote');
        await sock.sendMessage(remoteJid, { text: `👑 *تم منحه سلطة الإشراف في الظلام.*` }, { quoted: m });
    }
};
