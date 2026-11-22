const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'attp',
    aliases: ['ملصق_ملون', 'نص_متحرك'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ').replace(/['":\\]/g, '').trim();
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص بالإنجليزية بعد الأمر. مثال: `.attp DARK`' }, { quoted: m });

        const outWebp = path.join(__dirname, `attp_${Date.now()}.webp`);
        const cmd = `ffmpeg -y -f lavfi -i color=c=black:s=512x512:d=2:r=10 -vf "hue=H=2*PI*t:s=2,drawtext=text='${text}':fontcolor=yellow:fontsize=68:borderw=4:bordercolor=red:x=(w-text_w)/2:y=(h-text_h)/2" -vcodec libwebp -loop 0 "${outWebp}"`;

        exec(cmd, async (err) => {
            try {
                if (err || !fs.existsSync(outWebp)) {
                    return await sock.sendMessage(remoteJid, { text: '❌ تعذر صنع الملصق المتحرك.' }, { quoted: m });
                }
                await sock.sendMessage(remoteJid, { sticker: fs.readFileSync(outWebp) }, { quoted: m });
            } finally {
                if (fs.existsSync(outWebp)) fs.unlinkSync(outWebp);
            }
        });
    }
};
