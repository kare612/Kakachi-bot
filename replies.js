async function handleReplies(sock, from, msg, body) {
    try {
        const cleanText = body.trim();

        // نظام فحص التقاط إجابات ألعاب التخمين والفعاليات
        if (global.guessGame && global.guessGame[from]) {
            if (cleanText === global.guessGame[from].answer) {
                clearTimeout(global.guessGame[from].timeout);
                delete global.guessGame[from];
                return sock.sendMessage(from, { text: `🎉 *إجابة صحيحة مذهلة وسريعة!* \n\nلقد حزرت اسم الدولة الصحيح بنجاح! 🏆✨` }, { quoted: msg });
            }
        }

        // الردود التلقائية للمطور ورابط الشات المباشر له
        if (body.includes('مطور') || body.includes('المطور') || body.includes('المالك')) {
            let devReply = `👑 *﹝ قِـسْـمِ إِدَارَة كَـاكَـاشِـي بُـوت ﹞*\n\n👋 للتواصل المباشر مع مطور ومالك الروبوت اضغط على الرابط:\n🔗 https://wa.me`;
            return sock.sendMessage(from, { text: devReply }, { quoted: msg });
        }

        if (cleanText === 'هلا' || cleanText === 'السلام عليكم') {
            return sock.sendMessage(from, { text: `وعليكم السلام ورحمة الله وبركاته! اكتب \`.اوامر\` لتكتشف ميزاتي الأسطورية ⚡🥷` }, { quoted: msg });
        }

    } catch (err) {
        console.error("خطأ معالج الردود التلقائية:", err);
    }
}

module.exports = { handleReplies };
