const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ytround',
    aliases: ['دائري', 'فيديو_دائري', 'ptv', 'round'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(
                remoteJid,
                { text: '❌ اكتب اسم الفيديو أو رابط يوتيوب بعد الأمر.\nمثال: `.دائري تصميم jinwoo`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: `⭕ *جاري سحب وتحويل الفيديو إلى دائري لـ:* ${query}...` }, { quoted: m });

        const timestamp = Date.now();
        const rawVid = path.join(__dirname, `raw_${timestamp}.mp4`);
        const roundVid = path.join(__dirname, `round_${timestamp}.mp4`);

        // التحقق هل المدخل رابط يوتيوب أم نص للبحث
        const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(query);
        const searchTerm = isUrl ? query : `ytsearch1:${query} edit`;

        // 1. تحميل الفيديو من يوتيوب مع تمرير node كـ runtime
        const downloadCmd = `yt-dlp --js-runtimes node --remote-components ejs:github -f "best[ext=mp4][filesize<25M]/bestvideo[ext=mp4][filesize<20M]+bestaudio[ext=m4a]/best[ext=mp4]" --merge-output-format mp4 -o "${rawVid}" "${searchTerm}"`;

        exec(downloadCmd, (dlErr, dlStdout, dlStderr) => {
            if (!fs.existsSync(rawVid)) {
                const errorLines = (dlStderr || '').split('\n').filter(line => line.includes('ERROR:'));
                const reason = errorLines.length > 0 ? errorLines.join('\n') : 'تعذر العثور على الفيديو أو حجمه كبير جداً.';
                return sock.sendMessage(remoteJid, { text: `❌ فشل التحميل:\n${reason}` }, { quoted: m });
            }

            // 2. قص الفيديو ليصبح مربعاً (1:1) وبمدة أقصاها 60 ثانية ليناسب الفيديو الدائري في واتساب
            const ffmpegCmd = `ffmpeg -i "${rawVid}" -t 60 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=480:480" -c:v libx264 -preset fast -crf 26 -c:a aac -b:a 128k -y "${roundVid}"`;

            exec(ffmpegCmd, async (ffErr) => {
                try {
                    // اختيار الفيديو المربع إذا نجح القص، أو الأصلي كبديل
                    const finalVid = fs.existsSync(roundVid) ? roundVid : rawVid;

                    await sock.sendMessage(
                        remoteJid,
                        {
                            video: fs.readFileSync(finalVid),
                            mimetype: 'video/mp4',
                            ptv: true // هذا الخيار يجعل الفيديو يظهر كرسالة فيديو دائرية في واتساب
                        },
                        { quoted: m }
                    );
                } catch (sendErr) {
                    await sock.sendMessage(
                        remoteJid,
                        { text: `❌ فشل إرسال الفيديو الدائري: ${sendErr.message}` },
                        { quoted: m }
                    );
                } finally {
                    // حذف الملفات المؤقتة لتوفير مساحة السيرفر
                    if (fs.existsSync(rawVid)) fs.unlinkSync(rawVid);
                    if (fs.existsSync(roundVid)) fs.unlinkSync(roundVid);
                }
            });
        });
    }
};
                          
