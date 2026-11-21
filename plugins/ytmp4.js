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

        await sock.sendMessage(remoteJid, { text: '🎬 *جاري تحميل الفيديو مباشرة...*' }, { quoted: m });
        const outVid = path.join(__dirname, `ytv_${Date.now()}.mp4`);

        exec(`yt-dlp -f "best[ext=mp4][filesize<50M]/best[ext=mp4]" -o "${outVid}" "${link}"`, async (err) => {
            if (err || !fs.existsSync(outVid)) {
                return sock.sendMessage(remoteJid, { text: '❌ تعذر التحميل (تأكد من تثبيت yt-dlp أو أن حجم الفيديو أقل من 50MB).' }, { quoted: m });
            }
            try {
                await sock.sendMessage(remoteJid, { video: fs.readFileSync(outVid), caption: '🌑 *تم التحميل بنجاح.*' }, { quoted: m });
            } finally {
                if (fs.existsSync(outVid)) fs.unlinkSync(outVid);
            }
        });
    }
};
