module.exports = {
    name: 'who',
    aliases: ['من'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });
        const question = args.join(' ');
        if (!question) return sock.sendMessage(remoteJid, { text: '❌ اكتب سؤالك بعد الأمر. مثال: `.من أكثر شخص غامض هنا؟`' }, { quoted: m });

        const groupMetadata = await sock.groupMetadata(remoteJid);
        const participants = groupMetadata.participants.map(p => p.id);
        const chosen = participants[Math.floor(Math.random() * participants.length)];

        await sock.sendMessage(
            remoteJid,
            { text: `🔮 *السؤال:* ${question}\n👤 *المختار من الظلال:* @${chosen.split('@')[0]}`, mentions: [chosen] },
            { quoted: m }
        );
    }
};
