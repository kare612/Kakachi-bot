module.exports = {
    name: 'img',
    aliases: ['صورة', 'صور', 'بحث_صور'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم الصورة التي تبحث عنها. مثال: `.img naruto`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: `🔍 *جاري البحث عن صورة:* ${query}...` }, { quoted: m });

        try {
            const searchUrl = new URL('https://duckduckgo.com');
            searchUrl.searchParams.set('q', query);
            searchUrl.searchParams.set('iax', 'images');
            searchUrl.searchParams.set('ia', 'images');

            const htmlRes = await fetch(searchUrl.href, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            const html = await htmlRes.text();
            const vqdMatch = html.match(/vqd=["']?([^"'&]+)/);
            if (!vqdMatch) throw new Error('لم يتم استخراج رمز البحث');

            const api = new URL('https://duckduckgo.comi.js');
            api.searchParams.set('l', 'wt-wt');
            api.searchParams.set('o', 'json');
            api.searchParams.set('q', query);
            api.searchParams.set('vqd', vqdMatch.at(1));

            const jsonRes = await fetch(api.href, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            const data = await jsonRes.json();
            const results = data.results || [];
            if (results.length === 0) throw new Error('لا توجد نتائج');

            const randomImg = results.at(Math.floor(Math.random() * Math.min(results.length, 15))).image;
            await sock.sendMessage(
                remoteJid,
                { image: { url: randomImg }, caption: `🖼️ *نتيجة البحث عن:* ${query}` },
                { quoted: m }
            );
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: `❌ تعذر جلب الصورة حالياً (${err.message}).` }, { quoted: m });
        }
    }
};
