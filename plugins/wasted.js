const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'wasted',
    aliases: ['مات', 'ويستد'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted ? { message: quoted } : m;
        if (!targetMsg.message?.imageMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ أرسل صورة أو رد عليها بالأمر `.wasted`' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const id = Date.now();
            const inImg = path.join(__dirname, `ws_in_${id}.jpg`);
            const outImg = path.join(__dirname, `ws_out_${id}.jpg`);

            fs.writeFileSync(inImg, buffer);
            const cmd = `ffmpeg -y -i "${inImg}" -vf "scale=540:540:force_original_aspect_ratio=increase,crop=540:540,format=gray,drawbox=x=0:y=210:w=540:h=120:color=black@0.75:t=fill,drawtext=text='WASTED':fontcolor=0xdc143c:fontsize=68:x=(w-text_w)/2:y=(h-text_h)/2" "${outImg}"`;

            exec(cmd, async (err) => {
                if (fs.existsSync(inImg)) fs.unlinkSync(inImg);
                if (err || !fs.existsSync(outImg)) return sock.sendMessage(remoteJid, { text: '❌ تعذر تطبيق التأثير.' }, { quoted: m });

                await sock.sendMessage(remoteJid, { image: fs.readFileSync(outImg), caption: '🩸 *WASTED!*' }, { quoted: m });
                fs.unlinkSync(outImg);
            });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء معالجة الصورة.' }, { quoted: m });
        }
    }
};
          
