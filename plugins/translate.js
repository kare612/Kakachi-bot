module.exports = {
    name: 'translate',
    aliases: ['ترجمة', 'ترجم', 'tr'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const text = args.join(' ') || quotedText;

        if (!text) {
            return sock.sendMessage(
                remoteJid,
                { text: '❌ اكتب النص لترجمته أو رد على رسالة بالأمر `.ترجمة`' },
                { quoted: m }
            );
        }

        try {
            const prompt = 'ترجم النص التالي إلى اللغة العربية بدقة وبدون أي مقدمات أو شرح إضافي: ' + text;
            const url = 'https://pollinations.ai' + encodeURIComponent(prompt) + '?model=openai';

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36'
                }
            });

            if (!res.ok) throw new Error('HTTP ' + res.status);
            const translated = await res.text();

            await sock.sendMessage(
                remoteJid,
                { text: `🌐 *الترجمة:*\n\n${translated}` },
                { quoted: m }
            );
        } catch (err) {
            await sock.sendMessage(
                remoteJid,
                { text: `❌ تعذر ترجمة النص حالياً (${err.message}).` },
                { quoted: m }
            );
        }
    }
};
