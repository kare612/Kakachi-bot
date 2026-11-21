module.exports = {
    name: 'dare',
    aliases: ['جرأة', 'تحدي'],
    async execute(sock, m, args, remoteJid) {
        const dares = [
            "أرسل آخر صورة التقطتها بهاتفك في المجموعة الآن.",
            "اكتب في حالتك (Status): 'أنا أراقبكم من الظلام' لمدة ساعة.",
            "أرسل رسالة صوتية وأنت تضحك ضحكة شريرة.",
            "اعترف بشيء محرج حدث لك أمام الجميع هنا.",
            "غيّر صورة بروفايلك لصورة مرعبة لمدة 30 دقيقة."
        ];
        const random = dares[Math.floor(Math.random() * dares.length)];
        await sock.sendMessage(remoteJid, { text: `🔥 *تحدي الجرأة:*\n\n${random}` }, { quoted: m });
    }
};
