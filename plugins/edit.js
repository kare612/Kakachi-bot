const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'edit',
    aliases: ['ايديت', 'تعديل_فيديو', 'مونتاج'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted ? { message: quoted } : m;

        if (!targetMsg.message?.videoMessage) {
            return sock.sendMessage(
                remoteJid,
                {
                    text: '❌ رد على فيديو واختر نوع التعديل:\n' +
                          '🎬 `.edit slow` (حركة بطيئة)\n' +
                          '⚡ `.edit fast` (تسريع الفيديو)\n' +
                          '🌑 `.edit dark` (فلتر ألوان مظلم)\n' +
                          '🔄 `.edit reverse` (عكس الفيديو)'
                },
                { quoted: m }
            );
        }

        const mode = args.at(0)?.toLowerCase() || 'dark';
        await sock.sendMessage(remoteJid, { text: `🎞️ *جاري عمل ايديت (${mode}) للفيديو...*` }, { quoted: m });

        try {
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const id = Date.now();
            const inVid = path.join(__dirname, `ed_in_${id}.mp4`);
            const outVid = path.join(__dirname, `ed_out_${id}.mp4`);

            fs.writeFileSync(inVid, buffer);

            let filterCmd = '';
            if (mode === 'slow' || mode === 'بطيء') {
                filterCmd = `-vf "setpts=1.6*PTS" -af "atempo=0.65"`;
            } else if (mode === 'fast' || mode === 'سريع') {
                filterCmd = `-vf "setpts=0.5*PTS" -af "atempo=2.0"`;
            } else if (mode === 'reverse' || mode === 'عكس') {
                filterCmd = `-vf "reverse" -af "areverse"`;
            } else {
                // فلتر ايديت مظلم وسينمائي افتراضي
                filterCmd = `-vf "eq=contrast=1.25:brightness=-0.06:saturation=1.35,unsharp=5:5:1.0:5:5:0.0"`;
            }

            const cmd = `ffmpeg -y -i "${inVid}" ${filterCmd} -c:v libx264 -preset ultrafast -crf 26 -c:a aac "${outVid}"`;

            exec(cmd, async (err) => {
                if (fs.existsSync(inVid)) fs.unlinkSync(inVid);
                if (err || !fs.existsSync(outVid)) {
                    return await sock.sendMessage(remoteJid, { text: '❌ تعذر تعديل الفيديو (تأكد أن مدة الفيديو قصيرة وأقل من 30 ثانية).' }, { quoted: m });
                }

                await sock.sendMessage(
                    remoteJid,
                    { video: fs.readFileSync(outVid), mimetype: 'video/mp4', caption: `🎬 *تم عمل الايديت (${mode}) بنجاح.*` },
                    { quoted: m }
                );
                fs.unlinkSync(outVid);
            });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء معالجة الفيديو.' }, { quoted: m });
        }
    }
};
                                         
