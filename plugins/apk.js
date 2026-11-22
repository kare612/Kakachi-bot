module.exports = {
    name: 'apk',
    aliases: ['تطبيق', 'تطبيقات', 'تحميل_تطبيق'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم التطبيق بعد الأمر. مثال: `.apk VLC`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: `📦 *جاري البحث وتحميل ملف APK لـ:* ${query}...` }, { quoted: m });

        try {
            // البحث في قاعدة بيانات تطبيقات الأندرويد المفتوحة (F-Droid Search API)
            const searchApi = new URL('https://f-droid.org');
            searchApi.searchParams.set('q', query);

            const res = await fetch(searchApi.href, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36' }
            });
            const data = await res.json();
            const firstApp = data?.apps?.at(0);

            if (!firstApp || !firstApp.url) {
                throw new Error('التطبيق غير متوفر في المستودع المباشر');
            }

            // استخراج اسم الحزمة (Package Name) لبناء رابط الـ APK المباشر
            const pkgName = firstApp.url.split('/').pop();
            const infoApi = new URL('https://f-droid.org' + pkgName);
            const infoRes = await fetch(infoApi.href);
            const pkgData = await infoRes.json();
            const versionCode = pkgData?.suggestedVersionCode || pkgData?.packages?.at(0)?.versionCode;

            if (!versionCode) throw new Error('تعذر تحديد نسخة التطبيق');

            const apkDownloadUrl = `https://f-droid.org{pkgName}_${versionCode}.apk`;

            await sock.sendMessage(
                remoteJid,
                { text: `📱 *التطبيق:* ${firstApp.name}\n📝 *الوصف:* ${firstApp.summary}\n⏳ *جاري إرسال ملف APK...*` },
                { quoted: m }
            );

            // تنزيل ملف APK في الذاكرة وإرساله لواتساب مباشرة
            const apkRes = await fetch(apkDownloadUrl);
            if (!apkRes.ok) throw new Error('فشل سحب ملف الحزمة');
            const apkBuffer = Buffer.from(await apkRes.arrayBuffer());

            await sock.sendMessage(
                remoteJid,
                {
                    document: apkBuffer,
                    mimetype: 'application/vnd.android.package-archive',
                    fileName: `${firstApp.name.replace(/[^a-zA-Z0-9\s\-_]/g, '')}.apk`
                },
                { quoted: m }
            );
        } catch {
            // إذا كان التطبيق تجارياً (مثل WhatsApp أو Facebook) يرسل رابط تحميل APK مباشر من Uptodown
            const cleanSlug = query.toLowerCase().trim().replace(/\s+/g, '-');
            const directPage = `https://${cleanSlug}://`;

            await sock.sendMessage(
                remoteJid,
                {
                    text: `📲 *رابط تنزيل ملف APK المباشر لتطبيق (${query}):*\n\n🔗 ${directPage}\n\n💡 *(تطبيقات المتجر التجاري تُحمّل مباشرة من هذا الرابط، بينما التطبيقات المفتوحة مثل VLC و Termux تُرسل كملف جاهز هنا).*`
                },
                { quoted: m }
            );
        }
    }
};
        
