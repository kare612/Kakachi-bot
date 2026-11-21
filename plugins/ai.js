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
            const protocol = 'https:' + '//';
            const host = 'text.pollinations.ai/';
            const fullUrl = protocol + host + encodeURIComponent(prompt) + '?model=openai';

            const res = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36'
                }
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
