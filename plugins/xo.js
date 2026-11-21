module.exports = {
    name: 'xo',
    aliases: ['اكس_او'],
    async execute(sock, m, args, remoteJid) {
        const opponent = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!opponent) return sock.sendMessage(remoteJid, { text: '❌ منشن صديقك لتحديه في لعبة XO. مثال: `.xo @صديقك`' }, { quoted: m });

        const sender = m.key.participant || remoteJid;
        const text = `🎮 *تـحـدي إكـس أو (XO)* 🎮\n\n` +
                     `❌ اللاعب 1: @${sender.split('@')[0]}\n` +
                     `⭕ اللاعب 2: @${opponent.split('@')[0]}\n\n` +
                     `1️⃣ | 2️⃣ | 3️⃣\n` +
                     `4️⃣ | 5️⃣ | 6️⃣\n` +
                     `7️⃣ | 8️⃣ | 9️⃣\n\n` +
                     `🕯️ *ابدأوا اللعب في الردود!*`;

        await sock.sendMessage(remoteJid, { text, mentions: [sender, opponent] }, { quoted: m });
    }
};
                                           
