const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'tomp3',
    aliases: ['لصوت', 'mp3'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted ? { message: quoted } : m;
        if (!targetMsg.message?.videoMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ رد على فيديو بالأمر `.tomp3` لتحويله إلى صوت.' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const id = Date.now();
            const inVid = path.join(__dirname, `vid_${id}.mp4`);
            const outAud = path.join(__dirname, `aud_${id}.mp3`);

            fs.writeFileSync(inVid, buffer);
            exec(`ffmpeg -i "${inVid}" -vn -acodec libmp3lame "${outAud}"`, async (err) => {
                if (fs.existsSync(inVid)) fs.unlinkSync(inVid);
                if (err || !fs.existsSync(outAud)) {
                    return sock.sendMessage(remoteJid, { text: '❌ تعذر استخراج الصوت من الفيديو.' }, { quoted: m });
                }
                await sock.sendMessage(remoteJid, { audio: fs.readFileSync(outAud), mimetype: 'audio/mpeg' }, { quoted: m });
                fs.unlinkSync(outAud);
            });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء التحويل.' }, { quoted: m });
        }
    }
};
                                                                                     
