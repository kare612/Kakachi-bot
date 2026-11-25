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
                { text: '❌ اكتب اسم الفيديو أو رابط يوتيوب بعد الأمر.\nمثال: `.دائري غبيمارو`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: `⭕ *جاري سحب وتحويل الفيديو إلى دائري لـ:* ${query}...` }, { quoted: m });

        const timestamp = Date.now();
        const rawVid = path.join(__dirname, `raw_${timestamp}.mp4`);
        const roundVid = path.join(__dirname, `round_${timestamp}.mp4`);

        const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(query);
        const searchTerm = isUrl ? query : `ytsearch1:${query} edit`;

        // تحميل جودة خفيفة وسريعة تناسب الواي فاي الضعيف
        const downloadCmd = `yt-dlp --js-runtimes node --remote-components ejs:github -f "best[ext=mp4][filesize<10M]/best[height<=480][ext=mp4]/worst[ext=mp4]" --merge-output-format mp4 -o "${rawVid}" "${searchTerm}"`;

        exec(downloadCmd, (dlErr, dlStdout, dlStderr) => {
            if (!fs.existsSync(rawVid)) {
                const errorLines = (dlStderr || '').split('\n').filter(line => line.includes('ERROR:'));
                const reason = errorLines.length > 0 ? errorLines.join('\n') : 'تعذر العثور على الفيديو أو الشبكة ضعيفة جداً.';
                return sock.sendMessage(remoteJid, { text: `❌ فشل التحميل:\n${reason}` }, { quoted: m });
            }

            // ضغط وقص الفيديو إلى مربع 240x240 بمدة 25 ثانية ليكون حجمه صغيراً جداً وسريع الرفع
            const ffmpegCmd = `ffmpeg -i "${rawVid}" -t 25 -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=240:240" -c:v libx264 -preset ultrafast -crf 30 -c:a aac -b:a 64k -y "${roundVid}"`;

            exec(ffmpegCmd, async () => {
                try {
                    const finalVid = fs.existsSync(roundVid) ? roundVid : rawVid;

                    await sock.sendMessage(
                        remoteJid,
                        {
                            video: fs.readFileSync(finalVid),
                            mimetype: 'video/mp4',
                            ptv: true
                        },
                        { quoted: m }
                    );
                } catch (sendErr) {
                    await sock.sendMessage(
                        remoteJid,
                        { text: `❌ فشل إرسال الفيديو الدائري:\n${sendErr.message}` },
                        { quoted: m }
                    );
                } finally {
                    if (fs.existsSync(rawVid)) fs.unlinkSync(rawVid);
                    if (fs.existsSync(roundVid)) fs.unlinkSync(roundVid);
                }
            });
        });
    }
};
