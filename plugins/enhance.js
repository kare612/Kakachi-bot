const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'enhance',
    aliases: ['تحسين', 'جودة', 'hd'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted ? { message: quoted } : m;
        if (!targetMsg.message?.imageMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ أرسل صورة أو رد عليها بالأمر `.enhance`' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const id = Date.now();
            const inImg = path.join(__dirname, `en_in_${id}.jpg`);
            const outImg = path.join(__dirname, `en_out_${id}.jpg`);

            fs.writeFileSync(inImg, buffer);
            const cmd = `ffmpeg -y -i "${inImg}" -vf "unsharp=5:5:1.2:5:5:0.0,eq=contrast=1.1:saturation=1.15" -q:v 1 "${outImg}"`;

            exec(cmd, async (err) => {
                if (fs.existsSync(inImg)) fs.unlinkSync(inImg);
                if (err || !fs.existsSync(outImg)) return sock.sendMessage(remoteJid, { text: '❌ تعذر تحسين الصورة.' }, { quoted: m });

                await sock.sendMessage(remoteJid, { image: fs.readFileSync(outImg), caption: '✨ *تم تحسين حدة وألوان الصورة.*' }, { quoted: m });
                fs.unlinkSync(outImg);
            });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء معالجة الصورة.' }, { quoted: m });
        }
    }
};
              
