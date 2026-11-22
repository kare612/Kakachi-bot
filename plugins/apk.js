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
                { text: '❌ اكتب اسم التطبيق بعد الأمر. مثال:\n`.apk free music`\n`.apk facebook lite`\n`.apk vlc`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: `🌐 *جاري البحث في المتجر عن:* ${query}...` }, { quoted: m });

        try {
            // البحث عبر واجهة المتجر المفتوحة لجلب اسم التطبيق ورابط ملف APK المباشر
            const apiUrl = new URL('https://aptoide.com');
            apiUrl.searchParams.set('query', query);
            apiUrl.searchParams.set('limit', '1');

            const res = await fetch(apiUrl.href, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                    'Accept': 'application/json'
                }
            });

            const text = await res.text();
            let app = null;

            if (!text.trim().startsWith('<')) {
                const json = JSON.parse(text);
                app = json?.datalist?.list?.at(0);
            }

            if (!app || !app.file?.path) {
                return await sock.sendMessage(
                    remoteJid,
                    { text: `❌ لم يتم العثور على ملف APK مباشر لتطبيق (${query}) حالياً.` },
                    { quoted: m }
                );
            }

            const appName = app.name || query;
            const pkg = app.package || 'app';
            const downloadUrl = app.file.path;
            const sizeMB = (app.file.filesize / (1024 * 1024)).toFixed(2);
            const tempApk = path.join(__dirname, `${pkg}_${Date.now()}.apk`);

            await sock.sendMessage(
                remoteJid,
                { text: `📦 *التطبيق:* ${appName}\n⚖️ *الحجم:* ${sizeMB} MB\n⏳ *جاري تنزيل ملف الـ APK وإرساله إليك...*` },
                { quoted: m }
            );

            // تنزيل ملف APK مباشرة من رابط الخادم باستخدام curl
            const curlCmd = `curl -L -s --max-time 120 -o "${tempApk}" "${downloadUrl}"`;

            exec(curlCmd, async (err) => {
                try {
                    if (err || !fs.existsSync(tempApk) || fs.statSync(tempApk).size < 100000) {
                        if (fs.existsSync(tempApk)) fs.unlinkSync(tempApk);
                        return await sock.sendMessage(
                            remoteJid,
                            { text: `❌ تعذر تنزيل حزمة (${appName}) من الخادم.` },
                            { quoted: m }
                        );
                    }

                    await sock.sendMessage(
                        remoteJid,
                        {
                            document: { url: tempApk },
                            mimetype: 'application/vnd.android.package-archive',
                            fileName: `${appName.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-_]/g, '')}.apk`,
                            caption: `✅ *${appName}* (${sizeMB} MB)`
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
                { text: `❌ حدث خطأ أثناء البحث: ${err.message}` },
                { quoted: m }
            );
        }
    }
};
                            
