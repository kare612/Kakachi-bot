const googleTTS = require('google-tts-api');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'قول',
    aliases: ['تكلم', 'انطق', 'say'],
    async execute(sock, msg, args) {
        const from = msg.key.remoteJid;

        // التحقق من أن المستخدم كتب نصاً بعد الأمر
        if (args.length === 0) {
            return await sock.sendMessage(from, { text: '❌ يرجى كتابة النص الذي تريد مني قوله.\nمثال: *.قول أهلاً بك يا مطوري*' }, { quoted: msg });
        }

        const textToSay = args.join(' ');

        try {
            // توليد رابط الصوت من جوجل (يدعم العربية تلقائياً)
            const audioUrl = googleTTS.getAudioUrl(textToSay, {
                lang: 'ar', // لغة النطق (العربية)
                slow: false, // سرعة الكلام العادية
                host: 'https://google.com',
            });

            // تحديد مسار مؤقت لحفظ ملف الصوت
            const tempAudioPath = path.join(__dirname, `../temp_${Date.now()}.mp3`);

            // تحميل ملف الصوت وحفظه في السيرفر مؤقتاً
            const response = await fetch(audioUrl);
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(tempAudioPath, Buffer.from(buffer));

            // إرسال الملف الصوتي كـ Voice Note (رسالة صوتية مباشرة)
            await sock.sendMessage(from, { 
                audio: { url: tempAudioPath }, 
                mimetype: 'audio/mp4', // الصيغة المدعومة للرسائل الصوتية في واتساب
                ptt: true // جعلها تظهر كرسالة صوتية مسجلة وليست ملف موسيقى
            }, { quoted: msg });

            // حذف الملف المؤقت بعد الإرسال للحفاظ على مساحة السيرفر
            setTimeout(() => {
                if (fs.existsSync(tempAudioPath)) {
                    fs.unlinkSync(tempAudioPath);
                }
            }, 5000);

        } catch (error) {
            console.error('خطأ في أمر النطق التلقائي:', error);
            await sock.sendMessage(from, { text: '❌ عذراً، حدث خطأ أثناء محاولة توليد الصوت.' }, { quoted: msg });
        }
    }
};
