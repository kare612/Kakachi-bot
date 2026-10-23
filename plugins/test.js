// مثال لملف داخل مجلد (ايضافة) باسم test.js
export default {
    command: ['فحص', 'test'], // الأوامر التي يستجيب لها (.فحص أو .test)
    async default({ sock, msg, args }) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: '✅ أهلاً بك! ملف الأمر الخارجي يعمل بنجاح ومستقر.' 
        }, { quoted: msg });
    }
};
