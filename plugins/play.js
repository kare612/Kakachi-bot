const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'play',
    aliases: ['شغل', 'تشغيل', 'صوتية'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم الأغنية أو المقطع الصوتي. مثال: `.play سورة الكهف`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: `🎵 *جاري البحث وتحميل:* ${query}...` }, { quoted: m });
        const outAud = path.join(__dirname, `play_${Date.now()}.mp3`);

        exec(`yt-dlp -x --audio-format mp3 --max-filesize 20M -o "${outAud}" "ytsearch1:${query}"`, async (err) => {
            try {
                if (err || !fs.existsSync(outAud)) {
                    return await sock.sendMessage(remoteJid, { text: '❌ تعذر العثور على المقطع الصوتي أو تحميله.' }, { quoted: m });
                }
                await sock.sendMessage(
                    remoteJid,
                    { audio: fs.readFileSync(outAud), mimetype: 'audio/mpeg' },
                    { quoted: m }
                );
            } finally {
                if (fs.existsSync(outAud)) fs.unlinkSync(outAud);
            }
        });
    }
};
