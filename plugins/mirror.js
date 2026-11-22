const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'mirror',
    aliases: ['مرآة', 'قلب'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted ? { message: quoted } : m;
        if (!targetMsg.message?.imageMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ أرسل صورة أو رد عليها بالأمر `.mirror`' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const id = Date.now();
            const inImg = path.join(__dirname, `m_in_${id}.jpg`);
            const outImg = path.join(__dirname, `m_out_${id}.jpg`);

            fs.writeFileSync(inImg, buffer);
            exec(`ffmpeg -y -i "${inImg}" -vf "hflip" "${outImg}"`, async (err) => {
                if (fs.existsSync(inImg)) fs.unlinkSync(inImg);
                if (err || !fs.existsSync(outImg)) return sock.sendMessage(remoteJid, { text: '❌ فشل قلب الصورة.' }, { quoted: m });

                await sock.sendMessage(remoteJid, { image: fs.readFileSync(outImg), caption: '🪞 *تم عكس الصورة في المرآة.*' }, { quoted: m });
                fs.unlinkSync(outImg);
            });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء معالجة الصورة.' }, { quoted: m });
        }
    }
};
  
