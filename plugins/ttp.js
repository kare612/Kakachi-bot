const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ttp',
    aliases: ['ملصق_نص', 'نص_ملصق'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ').replace(/['":\\]/g, '').trim();
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص بعد الأمر. مثال: `.ttp KAKASHI`' }, { quoted: m });

        const outWebp = path.join(__dirname, `ttp_${Date.now()}.webp`);
        const cmd = `ffmpeg -y -f lavfi -i color=c=black@0.0:s=512x512:d=1,format=rgba -vf "drawtext=text='${text}':fontcolor=white:fontsize=64:borderw=4:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2" -vcodec libwebp -lossless 1 "${outWebp}"`;

        exec(cmd, async (err) => {
            try {
                if (err || !fs.existsSync(outWebp)) {
                    return await sock.sendMessage(remoteJid, { text: '❌ تعذر صنع الملصق النصي.' }, { quoted: m });
                }
                await sock.sendMessage(remoteJid, { sticker: fs.readFileSync(outWebp) }, { quoted: m });
            } finally {
                if (fs.existsSync(outWebp)) fs.unlinkSync(outWebp);
            }
        });
    }
};
