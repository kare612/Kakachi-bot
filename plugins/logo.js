const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'logo',
    aliases: ['شعار', 'لوجو'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
        if (!text) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب الاسم بالإنجليزية لصنع شعار. مثال: `.logo KAKASHI`' }, { quoted: m });
        }

        const outImg = path.join(__dirname, `logo_${Date.now()}.png`);
        // رسم خلفية سوداء فخمة مع إطار أحمر قاني وكتابة الاسم في المنتصف
        const cmd = `ffmpeg -y -f lavfi -i color=c=0x0a0a0f:s=800x800:d=1 -vf "drawbox=x=30:y=30:w=740:h=740:color=0x8b0000:t=8,drawtext=text='${text}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 "${outImg}"`;

        exec(cmd, async (err) => {
            try {
                if (err || !fs.existsSync(outImg)) {
                    return await sock.sendMessage(remoteJid, { text: '❌ تعذر رسم الشعار محلياً.' }, { quoted: m });
                }
                await sock.sendMessage(
                    remoteJid,
                    { image: fs.readFileSync(outImg), caption: `🌑 *شعار الظلام:* ${text}` },
                    { quoted: m }
                );
            } finally {
                if (fs.existsSync(outImg)) fs.unlinkSync(outImg);
            }
        });
    }
};
