const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'toround',
    aliases: ['دائري', 'تحويل_دائري', 'تدوير', 'ptv', 'round'],
    async execute(sock, m, args, remoteJid) {
        // التحقق من وجود رسالة مقتبسة (رد على فيديو) أو إرسال الفيديو مع الأمر مباشرة
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMessage = quotedMsg ? { message: quotedMsg } : m;
        const videoMsg = targetMessage.message?.videoMessage;

        if (!videoMsg) {
            return sock.sendMessage(
                remoteJid,
                { text: '❌ قم بالرد على أي فيديو عادي واكتب `.دائري` لتحويله إلى فيديو دائري.' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: '⭕ *جاري تحويل الفيديو إلى دائري...*' }, { quoted: m });

        const timestamp = Date.now();
        const inputVid = path.join(__dirname, `in_${timestamp}.mp4`);
        const outputVid = path.join(__dirname, `out_${timestamp}.mp4`);

        try {
            // تنزيل الفيديو من رسالة الواتساب
            const buffer = await downloadMediaMessage(
                targetMessage,
                'buffer',
                {},
                { logger: console, reuploadRequest: sock.updateMediaMessage }
            );

            fs.writeFileSync(inputVid, buffer);

            // قص الفيديو ليصبح مربعاً (1:1) بمدة أقصاها 60 ثانية وضغطه لسرعة الإرسال
            const ffmpegCmd = `ffmpeg -i "${inputVid}" -t 60 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=320:320" -c:v libx264 -preset ultrafast -crf 28 -c:a aac -b:a 96k -y "${outputVid}"`;

            exec(ffmpegCmd, async (err) => {
                try {
                    const finalVid = fs.existsSync(outputVid) ? outputVid : inputVid;

                    await sock.sendMessage(
                        remoteJid,
                        {
                            video: fs.readFileSync(finalVid),
                            mimetype: 'video/mp4',
                            ptv: true // إرسال الفيديو كرسالة فيديو دائرية
                        },
                        { quoted: m }
                    );
                } catch (sendErr) {
                    await sock.sendMessage(
                        remoteJid,
                        { text: `❌ فشل إرسال الفيديو الدائري:\n${sendErr.message}` },
                        { quoted: m }
                    );
                } finally {
                    // تنظيف الملفات المؤقتة
                    if (fs.existsSync(inputVid)) fs.unlinkSync(inputVid);
                    if (fs.existsSync(outputVid)) fs.unlinkSync(outputVid);
                }
            });
        } catch (dlErr) {
            if (fs.existsSync(inputVid)) fs.unlinkSync(inputVid);
            await sock.sendMessage(
                remoteJid,
                { text: `❌ تعذر قراءة الفيديو من المحادثة:\n${dlErr.message}` },
                { quoted: m }
            );
        }
    }
};
              
