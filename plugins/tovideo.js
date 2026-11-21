const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'tovideo',
    aliases: ['لفيديو', 'توفيديو'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.stickerMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ رد على ملصق متحرك بالأمر `.tovideo`' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            const id = Date.now();
            const inWebp = path.join(__dirname, `stk_${id}.webp`);
            const outMp4 = path.join(__dirname, `vid_${id}.mp4`);

            fs.writeFileSync(inWebp, buffer);
            exec(`ffmpeg -y -i "${inWebp}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outMp4}"`, async (err) => {
                if (fs.existsSync(inWebp)) fs.unlinkSync(inWebp);
                if (err || !fs.existsSync(outMp4)) {
                    return await sock.sendMessage(remoteJid, { text: '❌ تعذر تحويل الملصق إلى فيديو.' }, { quoted: m });
                }
                await sock.sendMessage(
                    remoteJid,
                    { video: fs.readFileSync(outMp4), mimetype: 'video/mp4', caption: '🌑 *تم تحويل الملصق إلى فيديو.*' },
                    { quoted: m }
                );
                fs.unlinkSync(outMp4);
            });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء التحويل.' }, { quoted: m });
        }
    }
};
