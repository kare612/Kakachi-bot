const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'fb',
    aliases: ['فيسبوك', 'facebook'],
    async execute(sock, m, args, remoteJid) {
        const link = args.at(0);
        if (!link || (!link.includes('facebook.com') && !link.includes('fb.watch'))) {
            return sock.sendMessage(remoteJid, { text: '❌ ضع رابط فيديو فيسبوك بعد الأمر.' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🦇 *جاري سحب الفيديو من فيسبوك...*' }, { quoted: m });
        const outVid = path.join(__dirname, `fb_${Date.now()}.mp4`);

        exec(`yt-dlp -f "best[ext=mp4]" --max-filesize 25M -o "${outVid}" "${link}"`, async (err) => {
            try {
                if (err || !fs.existsSync(outVid)) {
                    return await sock.sendMessage(remoteJid, { text: '❌ تعذر تحميل الفيديو من فيسبوك.' }, { quoted: m });
                }
                await sock.sendMessage(
                    remoteJid,
                    { video: fs.readFileSync(outVid), mimetype: 'video/mp4', caption: '🌑 *تم التحميل من فيسبوك.*' },
                    { quoted: m }
                );
            } finally {
                if (fs.existsSync(outVid)) fs.unlinkSync(outVid);
            }
        });
    }
};
