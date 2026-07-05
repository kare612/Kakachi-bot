const fs = require('fs');
const path = require('path');

global.ninjaDatabase = global.ninjaDatabase || {};
global.guessGame = global.guessGame || {};

async function handleCommand(sock, from, msg, body) {
    try {
        const cleanText = body.trim();
        const sender = from.endsWith('@g.us') ? msg.key.participant : from;

        // 1. نظام الرد التلقائي والألعاب الصامتة
        if (global.guessGame && global.guessGame[from]) {
            if (cleanText === global.guessGame[from].answer) {
                clearTimeout(global.guessGame[from].timeout);
                delete global.guessGame[from];
                return sock.sendMessage(from, { text: `🎉 *إجابة صحيحة مذهلة وسريعة!* \n\nلقد حزرت اسم الدولة الصحيح بنجاح! 🏆✨` }, { quoted: msg });
            }
        }

        if (body.includes('مطور') || body.includes('المطور') || body.includes('المالك')) {
            let devReply = `👑 *﹝ قِـسْـمِ إِدَارَة كَـاكَـاشِـي بُـوت ﹞*\n\n👋 للتواصل المباشر مع مطور البوت اضغط هنا:\n🔗 https://wa.me`;
            return sock.sendMessage(from, { text: devReply }, { quoted: msg });
        }

        if (cleanText === 'هلا' || cleanText === 'السلام عليكم') {
            return sock.sendMessage(from, { text: `وعليكم السلام ورحمة الله وبركاته! اكتب \`.اوامر\` لتكتشف ميزاتي الأسطورية ⚡🥷` }, { quoted: msg });
        }

        // 2. معالج تشغيل ملفات الأوامر المنفصلة من المجلد
        if (!body.startsWith(global.prefix)) return;

        const args = body.slice(global.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const commandsFolder = path.join(__dirname, 'commands');
        const commandFile = path.join(commandsFolder, `${commandName}.js`);

        if (fs.existsSync(commandFile)) {
            const command = require(commandFile);
            await command.run(sock, from, msg, args, commandName);
        }

    } catch (err) {
        console.error("خطأ في معالج الأوامر الذكي:", err);
    }
}

module.exports = {
    handleCommand: handleCommand
};

