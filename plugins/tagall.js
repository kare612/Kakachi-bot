module.exports = {
    name: 'tagall',
    aliases: ['الكل', 'منشن_الكل'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        const groupMetadata = await sock.groupMetadata(remoteJid);
        const participants = groupMetadata.participants.map(p => p.id);
        let text = `🌑 *استدعاء كافة الأرواح:*\n${args.join(' ') || ''}\n\n`;
        
        for (let mem of participants) {
            text += `🕯️ @${mem.split('@')[0]}\n`;
        }

        await sock.sendMessage(remoteJid, { text, mentions: participants }, { quoted: m });
    }
};
