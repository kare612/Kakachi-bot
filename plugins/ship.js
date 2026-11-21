module.exports = {
    name: 'ship',
    aliases: ['توافق', 'نسبة'],
    async execute(sock, m, args, remoteJid) {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length < 2) {
            return sock.sendMessage(remoteJid, { text: '❌ قم بعمل منشن لشخصين! مثال: `.ship @شخص1 @شخص2`' }, { quoted: m });
        }
        const percentage = Math.floor(Math.random() * 101);
        const text = `🔮 *نسبة التوافق بين الأرواح:*\n\n@${mentioned[0].split('@')[0]} ❤️ @${mentioned[1].split('@')[0]}\n📊 النتيجة: *${percentage}%*`;
        await sock.sendMessage(remoteJid, { text, mentions: mentioned }, { quoted: m });
    }
};
