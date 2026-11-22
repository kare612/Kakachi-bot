const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'apk',
    aliases: ['تطبيق', 'تطبيقات', 'تحميل_تطبيق'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ').toLowerCase().trim();
        if (!query) {
            return sock.sendMessage(
                remoteJid,
                { text: '❌ اكتب اسم التطبيق أو جزءاً منه. مثال:\n`.apk whatsapp`\n`.apk free`\n`.apk music`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: `📦 *جاري البحث واستخراج ملف APK لـ:* ${query}...` }, { quoted: m });

        // البحث في حزم التطبيقات المثبتة على الهاتف واستخراج مسار الـ APK الفعلي
        exec(`pm list packages -f | grep -i "${query.replace(/[^a-z0-9._-]/g, '')}" | head -n 1`, async (err, stdout) => {
            try {
                const line = stdout.trim();
                if (!line || !line.includes('package:')) {
                    return await sock.sendMessage(
                        remoteJid,
                        { text: `❌ لم يتم العثور على تطبيق بهذا الاسم في جهازك (${query}). جرب كتابة اسم الحزمة بالإنجليزية مثل \`whatsapp\` أو \`termux\` أو \`chrome\`.` },
                        { quoted: m }
                    );
                }

                // استخراج مسار ملف base.apk واسم الحزمة
                const raw = line.replace('package:', '');
                const lastEq = raw.lastIndexOf('=');
                const apkSourcePath = raw.slice(0, lastEq);
                const pkgName = raw.slice(lastEq + 1);

                const tempApk = path.join(__dirname, `${pkgName}_${Date.now()}.apk`);
                fs.copyFileSync(apkSourcePath, tempApk);

                const stats = fs.statSync(tempApk);
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                if (parseFloat(sizeMB) > 60) {
                    fs.unlinkSync(tempApk);
                    return await sock.sendMessage(
                        remoteJid,
                        { text: `⚠️ حجم التطبيق (${pkgName}) كبير جداً (${sizeMB} MB) ولا يمكن إرساله عبر واتساب.` },
                        { quoted: m }
                    );
                }

                await sock.sendMessage(
                    remoteJid,
                    { text: `📱 *الحزمة:* ${pkgName}\n⚖️ *الحجم:* ${sizeMB} MB\n⏳ *جاري إرسال ملف الـ APK إليك...*` },
                    { quoted: m }
                );

                await sock.sendMessage(
                    remoteJid,
                    {
                        document: fs.readFileSync(tempApk),
                        mimetype: 'application/vnd.android.package-archive',
                        fileName: `${pkgName}.apk`
                    },
                    { quoted: m }
                );

                fs.unlinkSync(tempApk);
            } catch (e) {
                await sock.sendMessage(
                    remoteJid,
                    { text: `❌ تعذر استخراج ملف التطبيق: ${e.message}` },
                    { quoted: m }
                );
            }
        });
    }
};
                                                                   
