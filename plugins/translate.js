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
            const url = 'https://googleapis.com' + encodeURIComponent(text);

            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36'
                }
            });

            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            const translated = data[0].map(item => item[0]).join('');

            await sock.sendMessage(
                remoteJid,
                { text: `🌐 *الترجمة إلى العربية:*\n\n${translated}` },
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
