module.exports = {
    name: 'repeat',
    aliases: ['تكرار', 'كرر'],
    async execute(sock, m, args, remoteJid) {
        const count = parseInt(args.at(0));
        const text = args.slice(1).join(' ');
        if (!count || !text || count > 20 || count < 1) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب العدد (من 1 إلى 20) ثم النص. مثال: `.تكرار 5 مرحبا`' }, { quoted: m });
        }

        const repeated = Array(count).fill(text).join('\n');
        await sock.sendMessage(remoteJid, { text: repeated }, { quoted: m });
    }
};
