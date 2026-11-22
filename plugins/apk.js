module.exports = {
    name: 'apk',
    aliases: ['تطبيق', 'تطبيقات', 'تحميل_تطبيق'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم التطبيق بعد الأمر. مثال: `.apk Facebook Lite`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: `📦 *جاري البحث وتحميل تطبيق:* ${query}...` }, { quoted: m });

        try {
            const api = new URL('https://aptoide.com');
            api.searchParams.set('query', query);
            api.searchParams.set('limit', '1');
            api.searchParams.set('aab', '1');

            const res = await fetch(api.href, {
                headers: {
                    'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 13; SM-G991B Build/TP1A.220624.014)',
                    'Accept': 'application/json'
                }
            });

            const data = await res.json();
            const app = data?.datalist?.list?.at(0);

            if (!app || !app.file?.path) {
                return sock.sendMessage(remoteJid, { text: '❌ لم يتم العثور على هذا التطبيق.' }, { quoted: m });
            }

            const sizeMB = (app.file.filesize / (1024 * 1024)).toFixed(2);
            if (parseFloat(sizeMB) > 45) {
                return sock.sendMessage(
                    remoteJid,
                    { text: `⚠️ حجم التطبيق (${app.name}) كبير جداً (${sizeMB} MB) ولا يسمح واتساب بإرساله مباشرة.` },
                    { quoted: m }
                );
            }

            await sock.sendMessage(
                remoteJid,
                { text: `📱 *الاسم:* ${app.name}\n⚖️ *الحجم:* ${sizeMB} MB\n⏳ *جاري رفع الملف إليك في واتساب...*` },
                { quoted: m }
            );

            // تحميل ملف الـ APK في الذاكرة أولاً لضمان قبوله في واتساب
            const apkRes = await fetch(app.file.path);
            if (!apkRes.ok) throw new Error('فشل تنزيل ملف APK من الخادم');
            const apkBuffer = Buffer.from(await apkRes.arrayBuffer());

            await sock.sendMessage(
                remoteJid,
                {
                    document: apkBuffer,
                    mimetype: 'application/vnd.android.package-archive',
                    fileName: `${app.name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-_]/g, '')}.apk`
                },
                { quoted: m }
            );
        } catch (err) {
            await sock.sendMessage(
                remoteJid,
                { text: `❌ تعذر سحب التطبيق حالياً (${err.message}).` },
                { quoted: m }
            );
        }
    }
};
                
