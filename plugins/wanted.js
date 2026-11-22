const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'wanted',
    aliases: ['مطلوب'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted ? { message: quoted } : m;
        if (!targetMsg.message?.imageMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ أرسل صورة أو رد عليها بالأمر `.wanted`' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const id = Date.now();
            const inImg = path.join(__dirname, `w_in_${id}.jpg`);
            const outImg = path.join(__dirname, `w_out_${id}.jpg`);

            fs.writeFileSync(inImg, buffer);
            const cmd = `ffmpeg -y -i "${inImg}" -vf "scale=500:500:force_original_aspect_ratio=increase,crop=500:500,colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131,pad=580:720:40:120:color=0xd2b48c,drawtext=text='WANTED':fontcolor=0x3b1e08:fontsize=65:x=(w-text_w)/2:y=30,drawtext=text='DEAD OR ALIVE':fontcolor=0x8b0000:fontsize=34:x=(w-text_w)/2:y=650" "${outImg}"`;

            exec(cmd, async (err) => {
                if (fs.existsSync(inImg)) fs.unlinkSync(inImg);
                if (err || !fs.existsSync(outImg)) return sock.sendMessage(remoteJid, { text: '❌ تعذر تصميم الملصق.' }, { quoted: m });

                await sock.sendMessage(remoteJid, { image: fs.readFileSync(outImg), caption: '🤠 *مطلوب للعدالة في عالم الظلام!*' }, { quoted: m });
                fs.unlinkSync(outImg);
            });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء معالجة الصورة.' }, { quoted: m });
        }
    }
};
