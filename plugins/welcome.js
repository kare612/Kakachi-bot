module.exports = {
    name: 'الترحيب', // اسم الأمر الرئيسي
    aliases: ['welcome', 'ترحيب'], // الاختصارات المستعارة
    description: 'إرسال رسالة ترحيبية وتوضيحية للأعضاء الجدد',

    async execute(sock, m, args, remoteJid) {
        const welcomeMessage = `
👋 *أهلاً وسهلاً بك في المجموعة!*

✨ يسعدنا انضمامك إلينا. يرجى قراءة القوانين لتجنب الطرد والمحافظة على نظام الروم.

🤖 لاستكشاف ميزات البوت والأوامر المتاحة، قم بكتابة:
👉 *.منيو*
`.trim();

        await sock.sendMessage(remoteJid, { text: welcomeMessage }, { quoted: m });
    }
};
