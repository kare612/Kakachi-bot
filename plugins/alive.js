module.exports = {
    name: 'alive',
    aliases: ['حي', 'شغال'],
    async execute(sock, m, args, remoteJid) {
        const text = `🌑 *النظام المظلم مستيقظ ويعمل بكامل طاقته...*\n🕯️ اكتب *.menu* لاستعراض التعاويذ.`;
        await sock.sendMessage(remoteJid, { text }, { quoted: m });
    }
};
