module.exports = {
    name: 'lovecalc',
    aliases: ['نسبة_الحب', 'صداقة'],
    async execute(sock, m, args, remoteJid) {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length === 0) {
            return sock.sendMessage(remoteJid, { text: '❌ منشن شخصاً لقياس نسبة التوافق والصداقة معه.' }, { quoted: m });
        }

        const sender = m.key.participant || remoteJid;
        const target = mentioned.at(0);
        const percent = Math.floor(Math.random() * 101);
        const bar = '❤️'.repeat(Math.round(percent / 20)) + '🖤'.repeat(5 - Math.round(percent / 20));

        const text = `🔮 *مـقـيـاس الـتـوافـق فـي الـظـلام:*\n\n` +
                     `👤 @${sender.split('@').at(0)}\n` +
                     `👤 @${target.split('@').at(0)}\n\n` +
                     `📊 *النسبة:* *${percent}%*\n` +
                     `${bar}`;

        await sock.sendMessage(remoteJid, { text, mentions: [sender, target] }, { quoted: m });
    }
};
