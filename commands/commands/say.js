const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'قول',
    aliases: ['تكلم', 'انطق', 'say'],
    async execute(sock, msg, args) {
        const from = msg.key.remoteJid;

        if (args.length === 0) {
            return await sock.sendMessage(from, { text: '❌ يرجى كتابة النص الذي تريد مني قوله.\nمثال: *.قول أهلاً بك يا مطوري*' }, { quoted: msg });
        }

        const textToSay = args.join(' ');

        try {
            // استدعاء المكتبة ديناميكياً لتفادي خطأ TERMUX
            const googleTTS = await import('google-tts-api');

            // توليد رابط الصوت
            const audioUrl = googleTTS.getAudioUrl(textToSay, {
                lang: 'ar',
                slow: false,
                host: 'https://google.com',
            });

            const tempAudioPath = path.join(__dirname, `../temp_${Date.now()}.mp3`);

            const response = await fetch(audioUrl);
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(tempAudioPath, Buffer.from(buffer));

            await sock.sendMessage(from, { 
                audio: { url: tempAudioPath }, 
                mimetype: 'audio/mp4', 
                ptt: true 
            }, { quoted: msg });

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
