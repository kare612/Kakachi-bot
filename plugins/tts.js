module.exports = {
    name: 'tts',
    aliases: ['انطق', 'صوت'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص الذي تريد تحويله إلى صوت.' }, { quoted: m });

        try {
            const lang = /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
            const url = new URL('https://google.com');
            url.searchParams.set('ie', 'UTF-8');
            url.searchParams.set('q', text);
            url.searchParams.set('tl', lang);
            url.searchParams.set('client', 'gtx');

            const res = await fetch(url.href, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!res.ok) throw new Error('Failed to fetch audio');
            const audioBuffer = Buffer.from(await res.arrayBuffer());

            await sock.sendMessage(
                remoteJid,
                { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false },
                { quoted: m }
            );
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر توليد الصوت حالياً، حاول بنص أقصر.' }, { quoted: m });
        }
    }
};
