const { downloadMediaMessage, S_WHATSAPP_NET } = require('@whiskeysockets/baileys');
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

        // التحقق من هويتك ومعرفك الخاص (ID) كمطور
        const sender = m.key.participant || m.key.participantAlt || remoteJid;
        const isOwner = ['212715469251', '68531186057376'].some(id => sender.includes(id)) || m.key.fromMe;
        if (!isOwner) {
            return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });
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

            exec(`ffmpeg -y -i "${inImg}" -vf "scale=640:640:force_original_aspect_ratio=increase,crop=640:640" -q:v 2 "${outImg}"`, async (err) => {
                if (fs.existsSync(inImg)) fs.unlinkSync(inImg);
                const finalBuffer = (!err && fs.existsSync(outImg)) ? fs.readFileSync(outImg) : buffer;
                if (fs.existsSync(outImg)) fs.unlinkSync(outImg);

                try {
                    await sock.query({
                        tag: 'iq',
                        attrs: {
                            to: S_WHATSAPP_NET || 's.whatsapp.net',
                            type: 'set',
                            xmlns: 'w:profile:picture',
                            target: remoteJid
                        },
                        content: [
                            {
                                tag: 'picture',
                                attrs: { type: 'image' },
                                content: finalBuffer
                            }
                        ]
                    });
                    await sock.sendMessage(remoteJid, { text: '🌑 *تم تغيير صورة المجموعة بنجاح بأمر المطور!*' }, { quoted: m });
                } catch (e) {
                    await sock.sendMessage(remoteJid, { text: `❌ خطأ تقني من الخادم: ${e.message}` }, { quoted: m });
                }
            });
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: `❌ خطأ: ${err.message}` }, { quoted: m });
        }
    }
};
              
