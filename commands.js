module.exports = {
    name: 'ادوات',
    run: async (sock, from, msg, args, commandName) => {
        const textArgs = args.join(" ");

        // 1. أمر تفكيك وتفكيك الكلمات (مثال: .تفكيك كاكاشي)
        if (commandName === 'تفكيك') {
            if (!textArgs) return sock.sendMessage(from, { text: "❌ يرجى كتابة الكلمة لتفكيكها!\nمثال: .تفكيك كاكاشي" }, { quoted: msg });
            
            // تفكيك الكلمة إلى حروف منفصلة مع إضافة زخرفة خفيفة
            let disassembled = textArgs.split('').join(' - ');
            let wordLength = textArgs.length;
            
            let replyText = `📊 *﹝ تفكيك الكلمات - كاكاشي ﹞*\n\n`;
            replyText += `📝 *الكلمة الأصلية:* ${textArgs}\n`;
            replyText += `✂️ *الكلمات/الحروف المفككة:* [ ${disassembled} ]\n`;
            replyText += `🔢 *عدد الحروف:* ${wordLength}`;
            
            return sock.sendMessage(from, { text: replyText }, { quoted: msg });
        }

        // 2. أمر البحث باستخدام الـ API (مثال: .بحث ون بيس)
        if (commandName === 'بحث') {
            if (!textArgs) return sock.sendMessage(from, { text: "❌ اكتب الشيء الذي تريد البحث عنه!\nمثال: .بحث الذكاء الاصطناعي" }, { quoted: msg });
            
            await sock.sendMessage(from, { text: `🔍 جاري البحث في الويب عبر الـ API عن: (${textArgs})...` }, { quoted: msg });
            
            try {
                // رابط API مجاني للبحث وجلب معلومات سريعة
                const searchApi = `https://duckduckgo.com{encodeURIComponent(textArgs)}&format=json&no_html=1`;
                const response = await fetch(searchApi).then(res => res.json());
                
                let resultText = response.AbstractText || "❌ لم يتم العثور على نتائج مفصلة في الموسوعة السريعة، جرب كلمة بحث أخرى.";
                
                let searchReply = `🔍 *﹝ نتائج البحث الذكي ﹞*\n\n`;
                searchReply += `📌 *الموضوع:* ${textArgs}\n`;
                searchReply += `📖 *الخلاصة:* ${resultText}\n\n`;
                searchReply += `🔗 *رابط رد تلقائي مخصص للمطور:* \nhttps://wa.me{encodeURIComponent('بخصوص بحث: ' + textArgs)}`;

                return sock.sendMessage(from, { text: searchReply }, { quoted: msg });
            } catch (e) {
                return sock.sendMessage(from, { text: "❌ عذراً، فشل الاتصال بخادم البحث (API)." }, { quoted: msg });
            }
        }
    }
};
