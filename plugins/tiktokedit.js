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

        await sock.sendMessage(remoteJid, { text: `🎬 *جاري سحب تصميم لـ:* ${query}...` }, { quoted: m });

        const outVid = path.join(__dirname, `edit_${Date.now()}.mp4`);
        const tags = ['edit', 'amv', 'twixtor', 'shorts edit'];
        const randomTag = tags.at(Math.floor(Math.random() * tags.length));
        const searchTerm = `ytsearch1:${query} ${randomTag}`;

        // بدون تحديد -f لكي يختار yt-dlp الصيغة المتوفرة تلقائياً ويدمجها إلى mp4
        const cmd = `yt-dlp --merge-output-format mp4 --max-filesize 25M -o "${outVid}" "${searchTerm}"`;

        exec(cmd, async (err, stdout, stderr) => {
            try {
                if (!fs.existsSync(outVid)) {
                    const reason = (stderr || err?.message || 'غير معروف').split('\n').filter(Boolean).pop();
                    return await sock.sendMessage(
                        remoteJid,
                        { text: `❌ تعذر سحب التصميم: ${reason}` },
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
                
