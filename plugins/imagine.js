module.exports = {
    name: 'imagine',
    aliases: ['رسم', 'تخيل'],
    async execute(sock, m, args, remoteJid) {
        const prompt = args.join(' ');
        if (!prompt) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب وصف الصورة (يفضل بالإنجليزية). مثال: `.imagine dark ninja warrior`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🎨 *جاري رسم لوحتك من الظلام...*' }, { quoted: m });

        try {
            const url = new URL('https://pollinations.ai' + encodeURIComponent(prompt));
            url.searchParams.set('nologo', 'true');
            url.searchParams.set('width', '768');
            url.searchParams.set('height', '768');

            const res = await fetch(url.href, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36'
                }
            });

            if (!res.ok) throw new Error('HTTP ' + res.status);
            const imageBuffer = Buffer.from(await res.arrayBuffer());

            await sock.sendMessage(
                remoteJid,
                { image: imageBuffer, caption: `🔮 *تم الرسم:* ${prompt}` },
                { quoted: m }
            );
        } catch (err) {
            await sock.sendMessage(
                remoteJid,
                { text: `❌ فشل توليد الصورة (${err.message}).` },
                { quoted: m }
            );
        }
    }
};
