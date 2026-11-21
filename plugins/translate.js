module.exports = {
    name: 'translate',
    aliases: ['ترجمة', 'ترجم', 'tr'],
    async execute(sock, m, args, remoteJid) {
        const quotedText = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;
        const text = args.join(' ') || quotedText;
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص لترجمته أو رد على رسالة أجنبية بالأمر `.ترجمة`' }, { quoted: m });

        try {
            const url = `https://googleapis.com{encodeURIComponent(text)}`;
            const res = await fetch(url);
            const data = await res.json();
            const translated = data[0].map(item => item[0]).join('');
            await sock.sendMessage(remoteJid, { text: `🌐 *الترجمة:*\n\n${translated}` }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ فشل في ترجمة النص.' }, { quoted: m });
        }
    }
};
