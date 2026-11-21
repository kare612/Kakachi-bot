module.exports = {
    name: 'tts',
    aliases: ['انطق', 'صوت'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص الذي تريد تحويله إلى صوت.' }, { quoted: m });

        try {
            const isArabic = /[\u0600-\u06FF]/.test(text);
            const voice = isArabic ? 'Zeina' : 'Brian';

            const url = new URL('https://streamelements.com');
            url.searchParams.set('voice', voice);
            url.searchParams.set('text', text);

            const res = await fetch(url.href);
            if (!res.ok) throw new Error('API Error');

            const arrayBuffer = await res.arrayBuffer();
            const audioBuffer = Buffer.from(arrayBuffer);

            if (audioBuffer.length < 500) {
                throw new Error('Empty audio');
            }

            await sock.sendMessage(
                remoteJid,
                { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false },
                { quoted: m }
            );
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر توليد الصوت حالياً، جرب نصاً آخر أو تأكد من الاتصال.' }, { quoted: m });
        }
    }
};
