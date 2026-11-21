const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'insta',
    aliases: ['انستا', 'انستغرام', 'ig'],
    async execute(sock, m, args, remoteJid) {
        const link = args.at(0);
        if (!link || !link.includes('instagram.com')) {
            return sock.sendMessage(remoteJid, { text: '❌ ضع رابط فيديو أو ريلز إنستغرام بعد الأمر.' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🦇 *جاري سحب الفيديو من إنستغرام...*' }, { quoted: m });
        const outVid = path.join(__dirname, `ig_${Date.now()}.mp4`);

        exec(`yt-dlp -f "best[ext=mp4]" --max-filesize 25M -o "${outVid}" "${link}"`, async (err) => {
            try {
                if (err || !fs.existsSync(outVid)) {
                    return await sock.sendMessage(remoteJid, { text: '❌ تعذر تحميل الفيديو (تأكد من أن الحساب عام والرابط صحيح).' }, { quoted: m });
                }
                await sock.sendMessage(
                    remoteJid,
                    { video: fs.readFileSync(outVid), mimetype: 'video/mp4', caption: '🌑 *تم التحميل من إنستغرام.*' },
                    { quoted: m }
                );
            } finally {
                if (fs.existsSync(outVid)) fs.unlinkSync(outVid);
            }
        });
    }
};
              
