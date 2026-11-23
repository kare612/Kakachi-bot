const axios = require('axios');

module.exports = {
    name: 'tts',
    aliases: ['انطق', 'صوت'],
    command: ['انطق', 'صوت', 'tts'],
    async execute(sock, m, args, remoteJid) {
        const text = Array.isArray(args) ? args.join(' ').trim() : '';
        if (!text) return sock.sendMessage(remoteJid, { text: '⚠️ اكتب النص المراد نطقه.\nمثال: *.انطق مرحبا بك*' }, { quoted: m });

        try {
            const url = `https://google.com{encodeURIComponent(text)}&tl=ar&client=tw-ob`;
            const res = await axios.get(url, { responseType: 'arraybuffer' });
            await sock.sendMessage(remoteJid, {
                audio: Buffer.from(res.data),
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(remoteJid, { text: `❌ تعذر تحويل النص لصوت: ${e.message}` }, { quoted: m });
        }
    }
};
