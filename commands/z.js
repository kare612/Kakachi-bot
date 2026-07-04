const axios = require('axios');

module.exports = {
    async execute(sock, msg, from, args) {
        try {
            // جلب صورة عشوائية عالية الجودة من API مفتوح
            const imageUrl = 'https://picsum.photos';
            
            await sock.sendMessage(from, { 
                image: { url: imageUrl }, 
                caption: '📸 *تم جلب صورة عشوائية فريدة بجودة عالية!*' 
            });
        } catch (err) {
            await sock.sendMessage(from, { text: '❌ عذراً، حدث خطأ أثناء تحميل الصورة.' });
        }
    }
};
module.exports = {
    async execute(sock, msg, from, args) {
        try {
            // رابط مباشر لملف صوتي (استبدله بأي رابط صوت mp3 مباشر تريده)
            const audioUrl = 'https://mp3quran.net'; 
            
            await sock.sendMessage(from, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mp4', // يظهر كملف صوتي عادي في الواتساب
                ptt: true // تفعل خيار أنه يظهر كأنه تسجيل صوتي (Voice Note) تم تسجيله الآن!
            });
        } catch (err) {
            await sock.sendMessage(from, { text: '❌ عذراً، فشل تحميل الملف الصوتي.' });
        }
    }module.exports = {
    async execute(sock, msg, from, args) {
        try {
            // رابط مباشر لمقطع فيديو (يمكنك وضع روابط فيديوهات مباشرة ومفتوحة تنتهي بـ mp4)
            const videoUrl = 'https://w3schools.com'; 
            
            await sock.sendMessage(from, { 
                video: { url: videoUrl }, 
                caption: '🎬 *تم جلب مقطع الفيديو المطلوب بنجاح!*' 
            });
        } catch (err) {
            await sock.sendMessage(from, { text: '❌ عذراً، حدث عطل أثناء جلب مقطع الفيديو.' });
        }
    }
};

};
