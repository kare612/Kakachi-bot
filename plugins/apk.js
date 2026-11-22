module.exports = {
    name: 'apk',
    aliases: ['تطبيق', 'تطبيقات', 'تحميل_تطبيق'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم التطبيق بعد الأمر. مثال: `.apk Facebook Lite`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: `📦 *جاري البحث وسحب ملف APK لتطبيق:* ${query}...` }, { quoted: m });

        try {
            // استخدام واجهة سحب تطبيقات الأندرويد المباشرة
            const api = new URL('https://akuari.my.id');
            api.searchParams.set('query', query);

            const res = await fetch(api.href, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36' }
            });
            const data = await res.json();
            const result = data?.respon || data?.result;

            if (!result || !result.link) {
                throw new Error('لم يتم العثور على رابط مباشر لهذا التطبيق');
            }

            await sock.sendMessage(
                remoteJid,
                { text: `📱 *الاسم:* ${result.title || query}\n⚖️ *الحجم:* ${result.size || 'غير محدد'}\n⏳ *جاري إرسال ملف الـ APK إليك...*` },
                { quoted: m }
            );

            // تحميل الملف في الذاكرة أولاً لضمان وصوله كملف قابل للتثبيت
            const fileRes = await fetch(result.link);
            if (!fileRes.ok) throw new Error('تعذر تنزيل الحزمة من الخادم');
            const fileBuffer = Buffer.from(await fileRes.arrayBuffer());

            await sock.sendMessage(
                remoteJid,
                {
                    document: fileBuffer,
                    mimetype: 'application/vnd.android.package-archive',
                    fileName: `${(result.title || query).replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-_]/g, '')}.apk`
                },
                { quoted: m }
            );
        } catch (err) {
            await sock.sendMessage(
                remoteJid,
                { text: `❌ تعذر سحب ملف التطبيق (${err.message}). جرب كتابة الاسم بالإنجليزية بدقة.` },
                { quoted: m }
            );
        }
    }
};
                 
