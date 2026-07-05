const axios = require('axios');

// دالة لجلب معلومات أو ردود ذكاء اصطناعي
async function getChatbotResponse(text) {
    try {
        const res = await axios.get(`https://simsimi.net{encodeURIComponent(text)}&lc=ar`);
        return res.data.success || "لم أفهم ذلك";
    } catch (error) {
        return "خطأ في الاتصال بالخادم";
    }
}

// دالة لتحميل فيديوهات تيك توك كمثال
async function downloadTikTok(url) {
    try {
        // ضع هنا رابط الـ API الخاص بالتحميل الذي تستخدمه
        const res = await axios.get(`https://example.com{encodeURIComponent(url)}`);
        return res.data.videoUrl; 
    } catch (error) {
        return null;
    }
}

module.exports = { getChatbotResponse, downloadTikTok };
