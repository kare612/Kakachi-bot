const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const FormData = require('form-data');

module.exports = {
    name: 'wasted',
    aliases: ['واستد'],
    command: ['wasted', 'واستد'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || m.message?.imageMessage;
        if (!quoted) return sock.sendMessage(remoteJid, { text: '⚠️ قم بالرد على صورة بأمر *.wasted*' }, { quoted: m });

        try {
            const stream = await downloadContentFromMessage(quoted, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            const form = new FormData();
            form.append('file', buffer, 'image.jpg');
            const upload = await axios.post('https://telegra.ph', form, { headers: form.getHeaders() });
            const imgUrl = 'https://telegra.ph' + upload.data[0].src;

            const effectUrl = `https://some-random-api.com{encodeURIComponent(imgUrl)}`;
            await sock.sendMessage(remoteJid, { image: { url: effectUrl }, caption: '💀 *WASTED*' }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر تطبيق التأثير حالياً.' }, { quoted: m });
        }
    }
};
