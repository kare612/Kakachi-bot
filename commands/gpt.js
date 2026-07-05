const axios = require('axios');

module.exports = {
    run: async (sock, from, msg, args) => {
        const text = args.join(" ");
        if (!text) return sock.sendMessage(from, { text: "❌ يرجى كتابة سؤالك بعد الأمر. مثال:\n.gpt كيف أتعلم البرمجة؟" }, { quoted: msg });

        await sock.sendMessage(from, { text: "⏳ جاري التفكير..." }, { quoted: msg });

        try {
            // استدعاء الـ API المختار
            const response = await axios.get(`https://simsimi.net{encodeURIComponent(text)}&lc=ar`);
            const reply = response.data.success || "لم أستطع فهم ذلك من الـ API";
            
            await sock.sendMessage(from, { text: `🤖 *[ ذكاء كاكاشي الاصطناعي ]*\n\n${reply}` }, { quoted: msg });
        } catch (error) {
            console.error(error);
            await sock.sendMessage(from, { text: "❌ عذراً، حدث خطأ أثناء الاتصال بالـ API." }, { quoted: msg });
        }
    }
};
module.exports = {
    name: 'اوامر',
    run: async (sock, from, msg, args) => {
        await sock.sendMessage(from, { text: "🥷 مرحباً بك في قائمة أوامر كاكاشي بـوت! الأوامر شغالة بنسبة 100% عبر المجلدات المنفصلة." }, { quoted: msg });
    }
};
