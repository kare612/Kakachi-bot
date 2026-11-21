const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'setpp',
    aliases: ['صورة_المجموعة', 'تغيير_الصورة'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) {
            return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });
        }

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted ? { message: quoted } : m;

        if (!targetMsg.message?.imageMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ أرسل صورة أو رد عليها بالأمر `.setpp`' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const id = Date.now();
            const inImg = path.join(__dirname, `pp_in_${id}.jpg`);
            const outImg = path.join(__dirname, `pp_out_${id}.jpg`);

            fs.writeFileSync(inImg, buffer);

            exec(`ffmpeg -y -i "${inImg}" -vf "scale=640:640:force_original_aspect_ratio=increase,crop=640:640" "${outImg}"`, async (err) => {
                if (fs.existsSync(inImg)) fs.unlinkSync(inImg);
                const imgPath = (!err && fs.existsSync(outImg)) ? outImg : inImg;

                try {
                    await sock.updateProfilePicture(remoteJid, { url: imgPath });
                    await sock.sendMessage(remoteJid, { text: '🌑 *تم تحديث صورة المجموعة بنجاح.*' }, { quoted: m });
                } catch (e) {
                    await sock.sendMessage(remoteJid, { text: `❌ خطأ واتساب: ${e.message}` }, { quoted: m });
                } finally {
                    if (fs.existsSync(outImg)) fs.unlinkSync(outImg);
                }
            });
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: `❌ خطأ التحميل: ${err.message}` }, { quoted: m });
        }
    }
};
                
