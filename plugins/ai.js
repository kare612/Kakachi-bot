module.exports = {
    name: 'ai',
    aliases: ['gpt', 'ذكاء', 'اسأل'],
    async execute(sock, m, args, remoteJid) {
        const prompt = args.join(' ');
        if (!prompt) return sock.sendMessage(remoteJid, { text: '❌ اكتب سؤالك للذكاء الاصطناعي. مثال: `.ai كيف أطور نفسي؟`' }, { quoted: m });

        await sock.sendMessage(remoteJid, { text: '🕯️ *جاري استحضار الإجابة من أعماق الظلام...*' }, { quoted: m });

        try {
            const url = new URL('https://pollinations.ai' + encodeURIComponent(prompt));
            url.searchParams.set('model', 'openai');

            const res = await fetch(url.href);
            if (!res.ok) throw new Error('API Error');
            const reply = await res.text();

            await sock.sendMessage(remoteJid, { text: `🧠 *الذكاء المظلم:*\n\n${reply}` }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر الاتصال بخادم الذكاء الاصطناعي حالياً، تأكد من الإنترنت أو الـ VPN.' }, { quoted: m });
        }
    }
};
