module.exports = {
    name: 'ai',
    aliases: ['gpt', 'ذكاء', 'اسأل'],
    async execute(sock, m, args, remoteJid) {
        const prompt = args.join(' ');
        if (!prompt) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب سؤالك. مثال: `.ai من هو ناروتو؟`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🕯️ *جاري استحضار الإجابة...*' }, { quoted: m });

        try {
            const res = await fetch('https://pollinations.ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36'
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'أنت مساعد ذكي وغامض تتحدث العربية بطلاقة واختصار.' },
                        { role: 'user', content: prompt }
                    ],
                    model: 'openai'
                })
            });

            if (!res.ok) throw new Error('HTTP ' + res.status);
            const reply = await res.text();

            await sock.sendMessage(remoteJid, { text: `🧠 *الذكاء المظلم:*\n\n${reply}` }, { quoted: m });
        } catch (err) {
            await sock.sendMessage(
                remoteJid,
                { text: `❌ تعذر الاتصال بالخادم (${err.message}).` },
                { quoted: m }
            );
        }
    }
};
