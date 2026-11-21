const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ytmp4',
    aliases: ['video', 'فيديو'],
    async execute(sock, m, args, remoteJid) {
        const link = args.at(0);
        if (!link || !link.startsWith('http')) {
            return sock.sendMessage(remoteJid, { text: '❌ ضع رابط الفيديو بعد الأمر. مثال: `.ytmp4 https://youtu.be...`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🎬 *جاري تحميل الفيديو بجودة متوافقة مع واتساب...*' }, { quoted: m });
        const outVid = path.join(__dirname, `ytv_${Date.now()}.mp4`);

        // تحميل جودة 480p بصيغة mp4 متوافقة مع واتساب وبحجم خفيف
        const cmd = `yt-dlp -f "best[height<=480][ext=mp4]/best[ext=mp4]" --max-filesize 25M -o "${outVid}" "${link}"`;

        exec(cmd, async (err) => {
            try {
                if (err || !fs.existsSync(outVid)) {
                    return await sock.sendMessage(remoteJid, { text: '❌ تعذر التحميل (الفيديو أطول من اللازم أو حجمه يتجاوز 25MB).' }, { quoted: m });
                }

                const videoBuffer = fs.readFileSync(outVid);
                await sock.sendMessage(
                    remoteJid,
                    { video: videoBuffer, mimetype: 'video/mp4', caption: '🌑 *تم التحميل بنجاح.*' },
                    { quoted: m }
                );
            } catch (uploadErr) {
                await sock.sendMessage(remoteJid, { text: `❌ فشل رفع الفيديو لواتساب: ${uploadErr.message}` }, { quoted: m });
            } finally {
                if (fs.existsSync(outVid)) fs.unlinkSync(outVid);
            }
        });
    }
};
