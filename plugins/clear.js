module.exports = {
    name: 'clear',
    aliases: ['تنظيف', 'مسح_الشاشة'],
    async execute(sock, m, args, remoteJid) {
        const emptyLines = '\n'.repeat(55);
        await sock.sendMessage(remoteJid, { text: `🧹 *جاري تطهير الدردشة...*${emptyLines}🕯️ *تم تنظيف الشاشة.*` });
    }
};
