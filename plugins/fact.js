module.exports = {
    name: 'fact',
    aliases: ['حقيقة', 'معلومة'],
    async execute(sock, m, args, remoteJid) {
        const facts = [
            "عقل الإنسان يولد طاقة كهربائية كافية لإضاءة مصباح صغير.",
            "الأخطبوط يمتلك ثلاثة قلوب وتسعة أدمغة ودمه أزرق اللون.",
            "الضوء يستغرق 8 دقائق و20 ثانية ليصل من الشمس إلى الأرض.",
            "بصمة اللسان تختلف من شخص لآخر تماماً مثل بصمة الإصبع.",
            "نحن نرى النجوم في السماء كما كانت في الماضي، لأن ضوءها يستغرق آلاف السنين ليصل إلينا."
        ];
        const random = facts[Math.floor(Math.random() * facts.length)];
        await sock.sendMessage(remoteJid, { text: `👁️ *حقيقة غامضة:*\n\n${random}` }, { quoted: m });
    }
};
