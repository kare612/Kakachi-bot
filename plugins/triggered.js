const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'triggered',
    aliases: ['غضب', 'معصب'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted ? { message: quoted } : m;
        if (!targetMsg.message?.imageMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ أرسل صورة أو رد عليها بالأمر `.triggered`' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const id = Date.now();
            const inImg = path.join(__dirname, `tr_in_${id}.jpg`);
            const outImg = path.join(__dirname, `tr_out_${id}.jpg`);

            fs.writeFileSync(inImg, buffer);
            const cmd = `ffmpeg -y -i "${inImg}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,colorbalance=rs=0.4:gs=-0.2:bs=-0.2,drawbox=x=0:y=420:w=512:h=92:color=red@0.85:t=fill,drawtext=text='TRIGGERED':fontcolor=white:fontsize=54:x=(w-text_w)/2:y=440" "${outImg}"`;

            exec(cmd, async (err) => {
                if (fs.existsSync(inImg)) fs.unlinkSync(inImg);
                if (err || !fs.existsSync(outImg)) return sock.sendMessage(remoteJid, { text: '❌ تعذر تطبيق تأثير الغضب.' }, { quoted: m });

                await sock.sendMessage(remoteJid, { image: fs.readFileSync(outImg), caption: '💢 *TRIGGERED!*' }, { quoted: m });
                fs.unlinkSync(outImg);
            });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء معالجة الصورة.' }, { quoted: m });
        }
    }
};
                 
