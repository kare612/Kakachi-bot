const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'tiktokedit',
    aliases: ['ايديت_تيكتوك', 'تصاميم', 'تصميم', 'ttedit'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(
                remoteJid,
                { text: '❌ اكتب اسم الشخصية أو نوع التصميم بعد الأمر.\nمثال: `.تصميم jinwoo` أو `.تصميم naruto`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: `🎬 *جاري البحث وسحب تصميم لـ:* ${query}...` }, { quoted: m });

        const outVid = path.join(__dirname, `edit_${Date.now()}.mp4`);
        // اختيار نتيجة عشوائية من أول 5 تصاميم لكي يعطيك تصميماً مختلفاً في كل مرة
        const randomIndex = Math.floor(Math.random() * 5) + 1;
        const searchTerm = `ytsearch5:${query} edit shorts 4k`;

        const cmd = `yt-dlp --playlist-items ${randomIndex} -f "best[height<=720][ext=mp4]/best[ext=mp4]" --max-filesize 20M -o "${outVid}" "${searchTerm}"`;

        exec(cmd, async (err) => {
            try {
                if (err || !fs.existsSync(outVid)) {
                    return await sock.sendMessage(
                        remoteJid,
                        { text: `❌ تعذر سحب تصميم لـ (${query}) حالياً، حاول مرة أخرى.` },
                        { quoted: m }
                    );
                }

                await sock.sendMessage(
                    remoteJid,
                    {
                        video: fs.readFileSync(outVid),
                        mimetype: 'video/mp4',
                        caption: `🌑 *تـصـمـيـم (Edit) جاهز:* ${query} 🎬`
                    },
                    { quoted: m }
                );
            } catch (sendErr) {
                await sock.sendMessage(
                    remoteJid,
                    { text: `❌ فشل إرسال الفيديو: ${sendErr.message}` },
                    { quoted: m }
                );
            } finally {
                if (fs.existsSync(outVid)) fs.unlinkSync(outVid);
            }
        });
    }
};
