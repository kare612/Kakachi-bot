module.exports = {
    name: 'img',
    aliases: ['صورة', 'صور', 'بحث_صور'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم الصورة التي تبحث عنها. مثال: `.img Kakashi Hatake`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: `🔍 *جاري البحث عن صورة:* ${query}...` }, { quoted: m });

        try {
            const url = new URL('https://pollinations.ai' + encodeURIComponent(query));
            url.searchParams.set('nologo', 'true');
            url.searchParams.set('width', '768');
            url.searchParams.set('height', '768');

            const res = await fetch(url.href, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36' }
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);

            const buffer = Buffer.from(await res.arrayBuffer());
            await sock.sendMessage(
                remoteJid,
                { image: buffer, caption: `🖼️ *نتيجة البحث عن:* ${query}` },
                { quoted: m }
            );
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر جلب الصورة حالياً، حاول بكلمة أخرى.' }, { quoted: m });
        }
    }
};
