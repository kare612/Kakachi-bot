const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'apk',
    aliases: ['تطبيق', 'تطبيقات', 'تحميل_تطبيق'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(
                remoteJid,
                { text: '❌ اكتب اسم التطبيق بالإنجليزية بعد الأمر. مثال:\n`.apk facebook lite`\n`.apk telegram`\n`.apk capcut`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: `🌐 *جاري البحث في المتجر الخارجي عن:* ${query}...` }, { quoted: m });

        try {
            // 1. البحث في المتجر الخارجي لجلب اسم حزمة التطبيق (Package Name)
            const searchUrl = new URL('https://apkpure.com');
            searchUrl.searchParams.set('key', query);
            searchUrl.searchParams.set('limit', '1');

            const searchRes = await fetch(searchUrl.href, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
                    'Accept': 'application/json'
                }
            });

            const searchData = await searchRes.json();
            const appInfo = searchData?.at(0);

            if (!appInfo || !appInfo.packageName) {
                return await sock.sendMessage(
                    remoteJid,
                    { text: `❌ لم يتم العثور على تطبيق باسم (${query}) في المتجر الخارجي. تأكد من كتابة الاسم بالإنجليزية بدقة.` },
                    { quoted: m }
                );
            }

            const pkg = appInfo.packageName;
            const appName = appInfo.title || pkg;
            const downloadUrl = `https://apkpure.com{pkg}?version=latest`;
            const tempApk = path.join(__dirname, `${pkg}_${Date.now()}.apk`);

            await sock.sendMessage(
                remoteJid,
                { text: `📦 *تم العثور على:* ${appName}\n🆔 *الحزمة:* ${pkg}\n⏳ *جاري تنزيل ملف الـ APK من الإنترنت وإرساله إليك...*` },
                { quoted: m }
            );

            // 2. تنزيل ملف APK الصافي من خادم التنزيل الخارجي إلى مجلد مؤقت
            const curlCmd = `curl -L -s --max-time 120 -A "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36" -o "${tempApk}" "${downloadUrl}"`;

            exec(curlCmd, async (err) => {
                try {
                    if (err || !fs.existsSync(tempApk)) {
                        return await sock.sendMessage(
                            remoteJid,
                            { text: `❌ فشل الاتصال بخادم تنزيل (${appName}).` },
                            { quoted: m }
                        );
                    }

                    const stats = fs.statSync(tempApk);
                    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                    // التحقق من أن الملف المحمّل هو ملف APK حقيقي وليس صفحة خطأ صغيرة
                    if (stats.size < 200000) {
                        fs.unlinkSync(tempApk);
                        return await sock.sendMessage(
                            remoteJid,
                            { text: `⚠️ هذا التطبيق (${appName}) محمي بصيغة XAPK/OBB ولا يتوفر كملف APK منفرد للتحميل المباشر.` },
                            { quoted: m }
                        );
                    }

                    // 3. إرسال ملف التطبيق الجاهز للتثبيت إلى واتساب
                    await sock.sendMessage(
                        remoteJid,
                        {
                            document: { url: tempApk },
                            mimetype: 'application/vnd.android.package-archive',
                            fileName: `${appName.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-_]/g, '')}.apk`,
                            caption: `✅ *${appName}*\n⚖️ *الحجم:* ${sizeMB} MB`
                        },
                        { quoted: m }
                    );
                } finally {
                    setTimeout(() => {
                        if (fs.existsSync(tempApk)) fs.unlinkSync(tempApk);
                    }, 20000);
                }
            });
        } catch (err) {
            await sock.sendMessage(
                remoteJid,
                { text: `❌ حدث خطأ أثناء جلب التطبيق من المتجر الخارجي: ${err.message}` },
                { quoted: m }
            );
        }
    }
};
                
