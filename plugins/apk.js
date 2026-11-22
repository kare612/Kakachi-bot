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
                { text: '❌ اكتب اسم التطبيق بالإنجليزية بعد الأمر. مثال:\n`.apk facebook lite`\n`.apk naruto`\n`.apk vlc`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: `🌐 *جاري البحث في المتجر الخارجي عن:* ${query}...` }, { quoted: m });

        try {
            // 1. البحث في متجر Google Play لاستخراج معرف الحزمة (Package ID) الحقيقي بدون حظر Cloudflare
            const playUrl = new URL('https://google.com');
            playUrl.searchParams.set('q', query);
            playUrl.searchParams.set('c', 'apps');

            const playRes = await fetch(playUrl.href, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36'
                }
            });
            const html = await playRes.text();

            // استخراج أول معرف حزمة تطبيق من نتائج المتجر
            const pkgMatch = html.match(/\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/);
            if (!pkgMatch || !pkgMatch.at(1)) {
                return await sock.sendMessage(
                    remoteJid,
                    { text: `❌ لم يتم العثور على تطبيق بهذا الاسم (${query}) في المتجر.` },
                    { quoted: m }
                );
            }

            const pkg = pkgMatch.at(1);
            const downloadUrl = `https://apkpure.com{pkg}?version=latest`;
            const tempApk = path.join(__dirname, `${pkg}_${Date.now()}.apk`);

            await sock.sendMessage(
                remoteJid,
                { text: `📦 *تم تحديد الحزمة:* ${pkg}\n⏳ *جاري تنزيل ملف الـ APK من الإنترنت وإرساله إليك...*` },
                { quoted: m }
            );

            // 2. تنزيل ملف APK الصافي باستخدام curl مع محاكاة متصفح أندرويد
            const curlCmd = `curl -L -s --max-time 120 -A "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36" -o "${tempApk}" "${downloadUrl}"`;

            exec(curlCmd, async (err) => {
                try {
                    if (err || !fs.existsSync(tempApk)) {
                        return await sock.sendMessage(
                            remoteJid,
                            { text: `❌ فشل الاتصال بخادم تنزيل (${pkg}).` },
                            { quoted: m }
                        );
                    }

                    const stats = fs.statSync(tempApk);
                    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                    // التحقق من أن الملف المحمل هو APK حقيقي (يبدأ بتوقيع ملفات ZIP/APK وهو 'PK')
                    const header = Buffer.alloc(2);
                    const fd = fs.openSync(tempApk, 'r');
                    fs.readSync(fd, header, 0, 2, 0);
                    fs.closeSync(fd);

                    if (header.toString() !== 'PK' || stats.size < 200000) {
                        fs.unlinkSync(tempApk);
                        return await sock.sendMessage(
                            remoteJid,
                            { text: `⚠️ التطبيق (${pkg}) محمي أو متوفر بصيغة XAPK فقط ولا يمكن سحبه كملف APK منفرد.` },
                            { quoted: m }
                        );
                    }

                    // 3. إرسال ملف التطبيق الجاهز للتثبيت إلى واتساب
                    await sock.sendMessage(
                        remoteJid,
                        {
                            document: { url: tempApk },
                            mimetype: 'application/vnd.android.package-archive',
                            fileName: `${pkg}.apk`,
                            caption: `✅ *${pkg}*\n⚖️ *الحجم:* ${sizeMB} MB`
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
                { text: `❌ حدث خطأ أثناء البحث عن التطبيق: ${err.message}` },
                { quoted: m }
            );
        }
    }
};
