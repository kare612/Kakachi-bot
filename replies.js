async function handleReplies(sock, from, msg, body) {
    try {
        const cleanText = body.trim();

        // 1. نظام فحص التقاط إجابات الألعاب لإنهاء الجلسات تلقائياً وحساب الجوائز
        if (global.guessGame && global.guessGame[from]) {
            if (cleanText === global.guessGame[from].answer) {
                clearTimeout(global.guessGame[from].timeout);
                delete global.guessGame[from];
                return sock.sendMessage(from, { text: `🎉 *إجابة صحيحة مذهلة وسريعة!* \n\nلقد حزرت اسم الدولة الصحيح بنجاح! 🏆✨` }, { quoted: msg });
            }
        }

        if (global.quizGame && global.quizGame[from]) {
            if (cleanText.toLowerCase() === global.quizGame[from].answer.toLowerCase()) {
                clearTimeout(global.quizGame[from].timeout);
                delete global.quizGame[from];
                return sock.sendMessage(from, { text: `🧠 *عبقري! إجابتك صحيحة ودقيقة جداً تضاف لنقاط ذكائك!* 🏆🎉` }, { quoted: msg });
            }
        }

        // 2. الردود التلقائية العادية والروابط الذكية الموجهة لرقم مطور البوت
        if (body.includes('مطور') || body.includes('المطور') || body.includes('المالك')) {
            let devReply = `👑 *﹝ قِـسْـمِ إِدَارَة كَـاكَـاشِـي بُـوت ﹞*\n\n👋 للتواصل المباشر مع مطور ومالك الروبوت المعتمد اضغط على الرابط التلقائي المباشر:\n🔗 https://wa.me`;
            return sock.sendMessage(from, { text: devReply }, { quoted: msg });
        }

        if (cleanText === 'هلا' || cleanText === 'السلام عليكم') {
            return sock.sendMessage(from, { text: `وعليكم السلام ورحمة الله وبركاته! يا بطل، أنا كاكاشي بوت جاهز لخدمتك، اكتب \`.اوامر\` لتكتشف ميزاتي الأسطورية ⚡🥷` }, { quoted: msg });
        }

    } catch (err) {
        console.error("خطأ معالج الردود:", err);
    }
}

module.exports = { handleReplies };
