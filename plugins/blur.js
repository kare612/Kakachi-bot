const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'blur',
    aliases: ['تغبيش', 'ضباب'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted ? { message: quoted } : m;
        if (!targetMsg.message?.imageMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ أرسل صورة أو رد عليها بالأمر `.blur`' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const id = Date.now();
            const inImg = path.join(__dirname, `blur_in_${id}.jpg`);
            const outImg = path.join(__dirname, `blur_out_${id}.jpg`);

            fs.writeFileSync(inImg, buffer);
            exec(`ffmpeg -y -i "${inImg}" -vf "boxblur=10:2" "${outImg}"`, async (err) => {
                if (fs.existsSync(inImg)) fs.unlinkSync(inImg);
                if (err || !fs.existsSync(outImg)) return sock.sendMessage(remoteJid, { text: '❌ فشل تطبيق الفلتر.' }, { quoted: m });

                await sock.sendMessage(remoteJid, { image: fs.readFileSync(outImg), caption: '🌫️ *تم تغبيش الصورة في الظلام.*' }, { quoted: m });
                fs.unlinkSync(outImg);
            });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء معالجة الصورة.' }, { quoted: m });
        }
    }
};
