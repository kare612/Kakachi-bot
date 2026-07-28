export default {
    name: 'تست',               // اسم الأمر الذي سيكتبه المستخدم (.تست)
    alias: ['test', 'فحص'],   // الاختصارات البديلة للأمر
    async execute(client, m, args) {
        
        // إرسال رد تلقائي على الرسالة
        await client.sendMessage(m.key.remoteJid, { 
            text: '🚀 بوت كاكاشي يعمل بنجاح! مجلد الإضافات متصل الآن.' 
        }, { quoted: m });
        
    }
};
