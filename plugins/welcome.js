
// import axios from 'axios';

export default {
    // 1. الكلمات المفتاحية التي يستجيب لها هذا الأمر (اكتبها بدون النقطة)
    command: ['فحص', 'تأكيد', 'test'],
    
    // 2. تصنيف الأمر (عام، مشرفين، مطور...)
    category: 'user',
    
    // 3. الدالة الرئيسية التي يتم تشغيلها تلقائياً عند كتابة الأمر في الواتساب
    async default({ sock, msg, args }) {
        // تحديد رقم الشات المرسل منه (سواء مجموعة أو خاص)
        const chatJid = msg.key.remoteJid;
        
        // نص الرد الذي ترغب بإرساله
        const replyText = `🤖 *أهلاً بك يا مطور كاكاشي!* \n\nتم التعرف على ملف الأوامر الجديد داخل مجلد [ايضافة] بنجاح والأمر يعمل بنظام الـ APIs المطور.`;

        try {
            // إرسال الرسالة إلى المستخدم
            await sock.sendMessage(chatJid, { text: replyText }, { quoted: msg });
        } catch (error) {
            console.error("حدث خطأ أثناء تنفيذ الأمر الجديد:", error);
        }
    }
};
