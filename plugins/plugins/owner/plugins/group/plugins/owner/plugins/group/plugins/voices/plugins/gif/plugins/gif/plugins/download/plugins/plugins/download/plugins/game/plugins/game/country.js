async function handler(m, { conn }) {
    if (!global.gameActive) global.gameActive = {};
    
    if (global.gameActive[m.chat]) {
        clearTimeout(global.gameActive[m.chat].timeout);
        delete global.gameActive[m.chat];
    }
    
    const res = await fetch("https://gist.githubusercontent.com/Kyutaka101/799d5646ceed992bf862026847473852/raw/dcbecff259b1d94615d7c48079ed1396ed42ef67/gistfile1.txt");
    const data = await res.json();
    const country = data[Math.floor(Math.random() * data.length)];
    
    const msg = await conn.sendMessage(m.chat, {
        image: { url: country.img },
        caption: "🌍 *خمن العلم*\n\nلديك 30 ثانيه لـ الإجابة رد علي الرساله ب اسم العلم"
    });
    
    global.gameActive[m.chat] = {
        answer: country.name.toLowerCase(),
        image: country.img,
        msgId: msg.key.id,
        timeout: setTimeout(() => {
            if (global.gameActive[m.chat]) {
                const answer = global.gameActive[m.chat].answer;
                delete global.gameActive[m.chat];
                conn.sendMessage(m.chat, { text: `⏰ *أنتهي الوقت* الإجابة هي : *${answer}*` });
            }
        }, 30000)
    };
}

handler.before = async (m, { conn }) => {
    if (!m.quoted || !m.text) return;
    if (!global.gameActive?.[m.chat]) return;
    
    const game = global.gameActive[m.chat];
    if (m.quoted.id !== game.msgId) return;
    
    if (m.text.toLowerCase().trim() === game.answer) {
        clearTimeout(game.timeout);
        delete global.gameActive[m.chat];
        
        if (global.db?.users[m.sender]) {
            global.db.users[m.sender].xp = (global.db.users[m.sender].xp || 0) + 100;
            global.db.users[m.sender].cookies = (global.db.users[m.sender].cookies  || 0) + 2;
        }
        
        await conn.sendMessage(m.chat, {
            image: { url: game.image },
            caption: `🎉 *صحيح صحيح* عاش جبت اسم العلم صح *100XP & 2 cookies*\n💡 هل هتعرف تكمل؟\n\n> اكتب *${m.prefix || '.'}علم* عشان تلعب تاني`
        });
        return true;
    }
    
    await m.reply("*❌ إجابة غلط رد جرب تاني*");
    return true;
};

handler.usage = ["علم"];
handler.category = "games";
handler.command = ['علم', 'country'];

export default handler;
