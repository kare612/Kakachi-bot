module.exports = {
    name: 'walink',
    aliases: ['رابط_واتساب', 'رابط_رقم'],
    async execute(sock, m, args, remoteJid) {
        const num = args.join('').replace(/[^0-9]/g, '');
        if (!num || num.length < 8) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب الرقم مع رمز الدولة. مثال: `.walink 212715469251`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: `🔗 *رابط المحادثة المباشر:*\nhttps://wa.me{num}` }, { quoted: m });
    }
};
