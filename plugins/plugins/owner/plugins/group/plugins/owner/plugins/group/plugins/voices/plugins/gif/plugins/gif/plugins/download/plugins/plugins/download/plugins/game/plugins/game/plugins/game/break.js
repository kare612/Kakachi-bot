handler.before = async (m, { conn }) => {
    if (!m.text || !global.break?.games[m.chat] || !global.break?.scores[m.chat]) return;

    const game = global.break.games[m.chat];
    const player = m.sender;
    
    if (m.text.trim() !== game.answer) return;

    clearTimeout(game.timeout);
    delete global.break.games[m.chat];

    if (!global.break.scores[m.chat][player]) global.break.scores[m.chat][player] = 0;
    global.break.scores[m.chat][player]++;
    
    let total = 0;
    for (let id in global.break.scores[m.chat]) {
        total += global.break.scores[m.chat][id];
    }
    
    if (total >= 20) {
        const entries = Object.entries(global.break.scores[m.chat])
            .sort((a, b) => b[1] - a[1]);
        
        const sorted = entries.map(([id, score], i) => 
            `${i+1}. @${id.split('@')[0]} - ${score} نقطة`
        );
        
        const mentions = entries.map(([id]) => id);
        
        const winner = entries[0][0];
        if (global.db?.users[winner]) {
            global.db.users[winner].xp = (global.db.users[winner].xp || 0) + 500;
            global.db.users[winner].cookies = (global.db.users[winner].cookies || 0) + 10;
        }
        
        await conn.sendMessage(m.chat, { 
            text: `🏆 *الفائزون في التفكيك*\n\n${sorted.join('\n')}\n\n🏅 @${winner.split('@')[0]} حصل على +500 XP و 🍪 +10 كوكيز`,
            mentions
        });
        delete global.break.scores[m.chat];
        return;
    }

    await m.reply(`✅ احسنت معاك: ${global.break.scores[m.chat][player]} نقطه`);
    handler(m, { conn });
};

async function handler(m, { conn }) {
    if (!global.break) global.break = { games: {}, scores: {} };

    if (global.break.games[m.chat]) {
        clearTimeout(global.break.games[m.chat].timeout);
        delete global.break.games[m.chat];
    }

    const data = await (await fetch("https://raw.githubusercontent.com/Xov445447533/Xov11111/master/src/JSON/venom-تفكيك.json")).json();
    const q = data[Math.floor(Math.random() * data.length)];
    
    m.reply(`
╭─┈─┈─┈─⟞🔨⟝─┈─┈─┈─╮
┃ *⌯︙ ${q.question}*
╰─┈─┈─┈─⟞⚙️⟝─┈─┈─┈─╯
> _*اكتب الكلام بسرعه عشان تتحسبلك نقطه + بعد ٣٠ ثانيه لو مردتش اللعبه هتنتهي*_`);
    
    if (!global.break.scores[m.chat]) global.break.scores[m.chat] = {};
    
    global.break.games[m.chat] = {
        answer: q.response,
        timeout: setTimeout(() => {
            if (global.break.games[m.chat]) {
                delete global.break.games[m.chat];
                delete global.break.scores[m.chat];
                m.reply("`⏰: انتهى الوقت`");
            }
        }, 30000)
    };
}

handler.usage = ["تفكيك"];
handler.category = "games";
handler.command = ['تفكيك'];
export default handler;
