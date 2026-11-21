module.exports = {
    name: 'kick',
    aliases: ['طرد', 'برا'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });
        
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return sock.sendMessage(remoteJid, { text: '❌ قم بعمل منشن للشخص أو رد على رسالته لطرده.' }, { quoted: m });

        await sock.groupParticipantsUpdate(remoteJid, [target], 'remove');
        await sock.sendMessage(remoteJid, { text: `🗡️ *تم نفي العضو إلى الهاوية.*` }, { quoted: m });
    }
};
