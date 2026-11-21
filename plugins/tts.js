module.exports = {
    name: 'tts',
    aliases: ['انطق', 'صوت'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص الذي تريد تحويله إلى صوت.' }, { quoted: m });

        try {
            const url = new URL('https://google.com');
            url.searchParams.set('ie', 'UTF-8');
            url.searchParams.set('q', text);
            url.searchParams.set('tl', 'ar');
            url.searchParams.set('client', 'tw-ob');

            await sock.sendMessage(
                remoteJid,
                { audio: { url: url.href }, mimetype: 'audio/mp4', ptt: true },
                { quoted: m }
            );
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر تحويل النص إلى صوت حالياً.' }, { quoted: m });
        }
    }
};
