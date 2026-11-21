module.exports = {
    name: 'truth',
    aliases: ['صراحة'],
    async execute(sock, m, args, remoteJid) {
        const questions = [
            "ما هو أكبر سر تخفيه عن أقرب أصدقائك؟",
            "هل سبق وأن كذبت لتخرج من مأزق كبير؟ وماذا كانت الكذبة؟",
            "من هو الشخص الذي تندم على معرفته؟",
            "ما هو أكثر شيء تخاف منه في الظلام؟",
            "لو أتيحت لك فرصة مسح ذكرى واحدة من حياتك، ماذا ستكون؟"
        ];
        const random = questions[Math.floor(Math.random() * questions.length)];
        await sock.sendMessage(remoteJid, { text: `🎭 *سؤال صراحة:*\n\n${random}` }, { quoted: m });
    }
};
