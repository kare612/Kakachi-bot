const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'sticker',
    aliases: ['ملصق', 's', 'ستيكر'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted ? { message: quoted } : m;
        const msgType = Object.keys(targetMsg.message || {})[0];

        if (msgType !== 'imageMessage' && msgType !== 'videoMessage') {
            return sock.sendMessage(remoteJid, { text: '❌ أرسل صورة أو فيديو قصير مع كتابة `.sticker` أو رد عليها بالأمر.' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const id = Date.now();
            const ext = msgType === 'imageMessage' ? 'jpg' : 'mp4';
            const inputPath = path.join(__dirname, `in_${id}.${ext}`);
            const outputPath = path.join(__dirname, `out_${id}.webp`);

            fs.writeFileSync(inputPath, buffer);

            const cmd = msgType === 'imageMessage'
                ? `ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" "${outputPath}"`
                : `ffmpeg -i "${inputPath}" -vcodec libwebp -filter:v fps=fps=15 -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 "${outputPath}"`;

            exec(cmd, async (err) => {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (err || !fs.existsSync(outputPath)) {
                    return sock.sendMessage(remoteJid, { text: '❌ تأكد من تثبيت ffmpeg في Termux.' }, { quoted: m });
                }
                const stickerBuffer = fs.readFileSync(outputPath);
                await sock.sendMessage(remoteJid, { sticker: stickerBuffer }, { quoted: m });
                fs.unlinkSync(outputPath);
            });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء صنع الملصق.' }, { quoted: m });
        }
    }
};
                      
