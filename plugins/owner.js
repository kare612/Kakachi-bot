module.exports = {
    name: 'owner',
    aliases: ['المطور', 'مطور'],
    async execute(sock, m, args, remoteJid) {
        const devNumber = '212715469251';
        await sock.sendMessage(
            remoteJid,
            {
                text: `👑 *مطور البوت:* @${devNumber}\n🌑 *تواصل معه عند الضرورة فقط.*`,
                mentions: [`${devNumber}@s.whatsapp.net`]
            },
            { quoted: m }
        );
    }
};
