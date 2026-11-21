module.exports = {
    name: 'support',
    aliases: ['الدعم', 'تواصل'],
    async execute(sock, m, args, remoteJid) {
        const devNumber = '212715469251';
        const text = `🕯️ *مـركـز الـدعـم الـسـري:*\n\n` +
                     `👑 *المطور:* @${devNumber}\n` +
                     `📱 *رابط المباشر:* https://wa.me{devNumber}\n\n` +
                     `⚡ *للاستفسارات وطلب تطوير البوتات.*`;

        await sock.sendMessage(remoteJid, { text, mentions: [`${devNumber}@s.whatsapp.net`] }, { quoted: m });
    }
};
