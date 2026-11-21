const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ytmp3',
    aliases: ['song', 'اغنية', 'صوت_يوتيوب'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم الأغنية أو ضع رابط يوتيوب بعد الأمر.' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🎵 *جاري استحضار الصوتية...*' }, { quoted: m });
        const outAud = path.join(__dirname, `yt_${Date.now()}.mp3`);
        const target = query.startsWith('http') ? query : `ytsearch1:${query}`;

        exec(`yt-dlp -x --audio-format mp3 -o "${outAud}" "${target}"`, async (err) => {
            if (err || !fs.existsSync(outAud)) {
                return sock.sendMessage(remoteJid, { text: '❌ تعذر تحميل الصوتية حالياً.' }, { quoted: m });
            }
            try {
                await sock.sendMessage(remoteJid, { audio: fs.readFileSync(outAud), mimetype: 'audio/mpeg' }, { quoted: m });
            } finally {
                if (fs.existsSync(outAud)) fs.unlinkSync(outAud);
            }
        });
    }
};
