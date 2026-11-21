module.exports = {
    name: 'logo',
    aliases: ['شعار', 'لوجو'],
    async execute(sock, m, args, remoteJid) {
        const name = args.join(' ');
        if (!name) return sock.sendMessage(remoteJid, { text: '❌ اكتب الاسم باللغة الإنجليزية لصنع شعار. مثال: `.logo KAKASHI`' }, { quoted: m });

        await sock.sendMessage(remoteJid, { text: '🎨 *جاري تصميم شعارك المظلم...*' }, { quoted: m });

        try {
            const prompt = `dark gothic gaming esports logo with glowing red and black shadows, text "${name}" in bold metallic style, 4k`;
            const url = new URL('https://pollinations.ai' + encodeURIComponent(prompt));
            url.searchParams.set('nologo', 'true');

            const res = await fetch(url.href, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36' }
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);

            const buffer = Buffer.from(await res.arrayBuffer());
            await sock.sendMessage(remoteJid, { image: buffer, caption: `🌑 *شعار:* ${name}` }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر تصميم الشعار حالياً، حاول مجدداً.' }, { quoted: m });
        }
    }
};
