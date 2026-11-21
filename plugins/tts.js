const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'tts',
    aliases: ['انطق', 'صوت'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ').replace(/["'`$\\]/g, '');
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص الذي تريد تحويله إلى صوت.' }, { quoted: m });

        const outFile = path.join(__dirname, `tts_${Date.now()}.wav`);
        const lang = /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';

        exec(`espeak -v ${lang} -w "${outFile}" "${text}"`, async (err) => {
            if (err || !fs.existsSync(outFile)) {
                return sock.sendMessage(remoteJid, { text: '❌ تأكد من تثبيت أداة espeak في Termux.' }, { quoted: m });
            }
            try {
                const audioBuffer = fs.readFileSync(outFile);
                await sock.sendMessage(
                    remoteJid,
                    { audio: audioBuffer, mimetype: 'audio/mp4', ptt: false },
                    { quoted: m }
                );
            } finally {
                if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
            }
        });
    }
};
                    
