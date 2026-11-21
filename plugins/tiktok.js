const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'tiktok',
    aliases: ['تيك_توك', 'tt'],
    async execute(sock, m, args, remoteJid) {
        const link = args.at(0);
        if (!link || !link.includes('tiktok.com')) {
            return sock.sendMessage(remoteJid, { text: '❌ ضع رابط فيديو تيك توك بعد الأمر. مثال: `.tiktok https://tiktok.com...`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🦇 *جاري سحب الفيديو من تيك توك...*' }, { quoted: m });
        const outVid = path.join(__dirname, `tt_${Date.now()}.mp4`);

        exec(`yt-dlp -f "best[ext=mp4]" --max-filesize 25M -o "${outVid}" "${link}"`, async (err) => {
            try {
                if (err || !fs.existsSync(outVid)) {
                    return await sock.sendMessage(remoteJid, { text: '❌ تعذر تحميل فيديو تيك توك.' }, { quoted: m });
                }
                await sock.sendMessage(
                    remoteJid,
                    { video: fs.readFileSync(outVid), mimetype: 'video/mp4', caption: '🌑 *تم التحميل من تيك توك.*' },
                    { quoted: m }
                );
            } finally {
                if (fs.existsSync(outVid)) fs.unlinkSync(outVid);
            }
        });
    }
};
