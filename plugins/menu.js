module.exports = {
    name: 'menu', // اسم الأمر الأساسي (يُكتب بعد النقطة مثل: .menu)
    aliases: ['اوامر', 'قائمة', 'help'], // أسماء بديلة للأمر
    async execute(sock, m, args, remoteJid) {
        // نص الرد الذي سيرسله البوت
        const replyText = `⚡ *قائمة أوامر بوت كاكاشي* ⚡\n\n` +
                          `🔹 *.menu* - عرض هذه القائمة\n` +
                          `🔹 *.ping* - فحص سرعة استجابة البوت\n\n` +
                          `👑 *المطور:* Kare612`;

        // إرسال الرسالة مع عمل منشن/رد على رسالة المستخدم
        await sock.sendMessage(remoteJid, { text: replyText }, { quoted: m });
    }
};
