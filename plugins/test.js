export default {
    command: ['فحص', 'تاكيد', 'تأكيد'],
    category: 'user',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        const replyText = `🤖 *استجابة فورية ناجحة!* \n\nتم استدعاء ملف الأمر وتشغيله ديناميكياً من داخل مجلد [ايضافة] بنجاح تفرّد تام.`;

        try {
            await sock.sendMessage(chatJid, { text: replyText }, { quoted: msg });
        } catch (error) {
            console.error("خطأ في ملف الإضافة المخصص:", error);
        }
    }
};
