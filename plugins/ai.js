module.exports = {
    name: 'ai',
    aliases: ['gpt', 'ذكاء', 'اسأل'],
    async execute(sock, m, args, remoteJid) {
        const prompt = args.join(' ');
        if (!prompt) return sock.sendMessage(remoteJid, { text: '❌ اكتب سؤالك. مثال: `.ai من هو كاكاشي؟`' }, { quoted: m });

        const apiKey = 'ضع_مفتاحك_هنا';
        await sock.sendMessage(remoteJid, { text: '🕯️ *جاري استحضار الإجابة...*' }, { quoted: m });

        try {
            const url = 'https://googleapis.com' + apiKey;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await res.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!reply) throw new Error(JSON.stringify(data));
            await sock.sendMessage(remoteJid, { text: `🧠 *الذكاء المظلم:*\n\n${reply}` }, { quoted: m });
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: `❌ خطأ تقني: ${err.message}` }, { quoted: m });
        }
    }
};
