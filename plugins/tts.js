module.exports = {
    name: 'tts',
    aliases: ['انطق', 'صوت'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص الذي تريد تحويله إلى صوت.' }, { quoted: m });

        const audioUrl = 'https://google.com' + encodeURIComponent(text) + '&tl=ar&client=tw-ob';
        await sock.sendMessage(remoteJid, { audio: { url: audioUrl }, mimetype: 'audio/mp4', ptt: true }, { quoted: m });
    }
};
