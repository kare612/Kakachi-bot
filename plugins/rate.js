module.exports = {
    name: 'rate',
    aliases: ['تقييم'],
    async execute(sock, m, args, remoteJid) {
        const thing = args.join(' ') || 'هذا الشيء';
        const score = Math.floor(Math.random() * 101);
        await sock.sendMessage(remoteJid, { text: `⚖️ *تقييم الظلام لـ (${thing}):*\n📊 النسبة: *${score}%*` }, { quoted: m });
    }
};
