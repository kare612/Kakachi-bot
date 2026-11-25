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
                { text: '❌ اكتب اسم الشخصية أو نوع التصميم بعد الأمر.\nمثال: `.تصميم كاكاشي` أو `.تصميم naruto`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: `🎬 *جاري سحب تصميم لـ:* ${query}...` }, { quoted: m });

        const outVid = path.join(__dirname, `edit_${Date.now()}.mp4`);
        const tags = ['edit', 'amv', 'twixtor', 'shorts edit'];
        const randomTag = tags.at(Math.floor(Math.random() * tags.length));
        const searchTerm = `ytsearch1:${query} ${randomTag}`;

        // اختيار صيغة mp4 خفيفة (أقل من 6MB أو 480p) لتسريع الرفع على الواي فاي الضعيف
        const cmd = `yt-dlp --js-runtimes node --remote-components ejs:github -f "best[ext=mp4][filesize<6M]/best[height<=480][ext=mp4]/worst[ext=mp4]" --merge-output-format mp4 -o "${outVid}" "${searchTerm}"`;

        exec(cmd, async (err, stdout, stderr) => {
            try {
                if (!fs.existsSync(outVid)) {
                    const errorLines = (stderr || '').split('\n').filter(line => line.includes('ERROR:'));
                    const reason = errorLines.length > 0
                        ? errorLines.join('\n')
                        : (stderr || err?.message || 'تعذر سحب الفيديو بسبب ضعف الاتصال.');

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
                    { text: `❌ فشل إرسال الفيديو:\n${sendErr.message}` },
                    { quoted: m }
                );
            } finally {
                if (fs.existsSync(outVid)) fs.unlinkSync(outVid);
            }
        });
    }
};
