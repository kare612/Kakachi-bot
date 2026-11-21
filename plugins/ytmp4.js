const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ytmp4',
    aliases: ['video', 'فيديو'],
    async execute(sock, m, args, remoteJid) {
        const link = args;
        if (!link || !link.startsWith('http')) {
            return sock.sendMessage(remoteJid, { text: '❌ ضع رابط فيديو يوتيوب بعد الأمر.' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🎬 *جاري تحميل الفيديو...*' }, { quoted: m });
        const outVid = path.join(__dirname, `ytv_${Date.now()}.mp4`);

        exec(`yt-dlp -f "best[ext=mp4][filesize<50M]" -o "${outVid}" "${link}"`, async (err) => {
            if (err || !fs.existsSync(outVid)) {
                return sock.sendMessage(remoteJid, { text: '❌ تعذر التحميل (قد يكون حجم الفيديو كبيراً جداً).' }, { quoted: m });
            }
            try {
                await sock.sendMessage(remoteJid, { video: fs.readFileSync(outVid), caption: '🌑 *تم التحميل.*' }, { quoted: m });
            } finally {
                if (fs.existsSync(outVid)) fs.unlinkSync(outVid);
            }
        });
    }
};
