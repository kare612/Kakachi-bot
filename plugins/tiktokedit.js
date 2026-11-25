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

        // تمرير node كـ runtime + اختيار صيغة mp4 بحجم أقل من 25M مباشرة لتجنب التخطي
        const cmd = `yt-dlp --js-runtimes node --remote-components ejs:github -f "best[ext=mp4][filesize<25M]/bestvideo[ext=mp4][filesize<20M]+bestaudio[ext=m4a]/best[ext=mp4]" --merge-output-format mp4 -o "${outVid}" "${searchTerm}"`;

        exec(cmd, async (err, stdout, stderr) => {
            try {
                if (!fs.existsSync(outVid)) {
                    // البحث عن سطر ERROR الفعلي بدلاً من عرض WARNING
                    const errorLines = (stderr || '').split('\n').filter(line => line.includes('ERROR:'));
                    const reason = errorLines.length > 0 
                        ? errorLines.join('\n') 
                        : (stdout.includes('File is larger than') ? 'حجم الفيديو أكبر من الحد المسموح (25MB).' : (stderr || err?.message || 'غير معروف'));

                    return await sock.sendMessage(
                        remoteJid,
                        { text: `❌ تعذر سحب التصميم:\n${reason}` },
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
