const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'tiktok',
    aliases: ['تيك_توك', 'tt'],
    async execute(sock, m, args, remoteJid) {
        const link = args;
        if (!link || !link.includes('tiktok.com')) {
            return sock.sendMessage(remoteJid, { text: '❌ ضع رابط فيديو تيك توك بعد الأمر. مثال: `.tiktok https://tiktok.com...`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🦇 *جاري سحب الفيديو من تيك توك...*' }, { quoted: m });
        const outVid = path.join(__dirname, `tt_${Date.now()}.mp4`);

        exec(`yt-dlp -f "mp4" -o "${outVid}" "${link}"`, async (err) => {
            if (err || !fs.existsSync(outVid)) {
                return sock.sendMessage(remoteJid, { text: '❌ تعذر تحميل الفيديو (تأكد من تثبيت yt-dlp في Termux).' }, { quoted: m });
            }
            try {
                await sock.sendMessage(remoteJid, { video: fs.readFileSync(outVid), caption: '🌑 *تم التحميل بنجاح.*' }, { quoted: m });
            } finally {
                if (fs.existsSync(outVid)) fs.unlinkSync(outVid);
            }
        });
    }
};
