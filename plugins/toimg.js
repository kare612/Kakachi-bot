const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'toimg',
    aliases: ['لصورة', 'صوره'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.stickerMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ رد على ملصق ثابت بالأمر `.toimg` لتحويله إلى صورة.' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            const id = Date.now();
            const inWebp = path.join(__dirname, `stk_${id}.webp`);
            const outPng = path.join(__dirname, `img_${id}.png`);

            fs.writeFileSync(inWebp, buffer);
            exec(`ffmpeg -i "${inWebp}" "${outPng}"`, async (err) => {
                if (fs.existsSync(inWebp)) fs.unlinkSync(inWebp);
                if (err || !fs.existsSync(outPng)) {
                    return sock.sendMessage(remoteJid, { text: '❌ تعذر تحويل الملصق (قد يكون متحركاً).' }, { quoted: m });
                }
                await sock.sendMessage(remoteJid, { image: fs.readFileSync(outPng), caption: '👁️ *تم استخراج الصورة من الملصق.*' }, { quoted: m });
                fs.unlinkSync(outPng);
            });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ فشل تحويل الملصق.' }, { quoted: m });
        }
    }
};
