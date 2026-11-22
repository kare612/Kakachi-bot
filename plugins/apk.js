const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'apk',
    aliases: ['تطبيق', 'تطبيقات', 'تحميل_تطبيق'],
    async execute(sock, m, args, remoteJid) {
        const keywords = args.map(w => w.toLowerCase().replace(/[^a-z0-9._-]/g, '')).filter(Boolean);
        if (keywords.length === 0) {
            return sock.sendMessage(
                remoteJid,
                { text: '❌ اكتب اسم التطبيق أو كلمة منه. مثال:\n`.apk whatsapp`\n`.apk freefire`\n`.apk termux`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: `📦 *جاري البحث وسحب ملف APK لـ:* ${args.join(' ')}...` }, { quoted: m });

        // البحث الذكي في جميع التطبيقات المثبتة دون التقيد بترتيب الكلمات
        const grepChain = keywords.map(k => `grep -i "${k}"`).join(' | ');
        exec(`pm list packages -f | ${grepChain} | head -n 1`, async (err, stdout) => {
            try {
                const line = stdout.trim();
                if (!line || !line.includes('package:')) {
                    return await sock.sendMessage(
                        remoteJid,
                        { text: `❌ لم يتم العثور على تطبيق يطابق (${args.join(' ')}) في جهازك. جرب كتابة كلمة واحدة من اسمه بالإنجليزية (مثل \`whatsapp\` أو \`freefire\`).` },
                        { quoted: m }
                    );
                }

                const raw = line.replace('package:', '');
                const lastEq = raw.lastIndexOf('=');
                const apkSourcePath = raw.slice(0, lastEq);
                const pkgName = raw.slice(lastEq + 1);

                const tempApk = path.join(__dirname, `${pkgName}_${Date.now()}.apk`);
                fs.copyFileSync(apkSourcePath, tempApk);

                const stats = fs.statSync(tempApk);
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                if (parseFloat(sizeMB) > 150) {
                    fs.unlinkSync(tempApk);
                    return await sock.sendMessage(
                        remoteJid,
                        { text: `⚠️ حجم التطبيق (${pkgName}) ضخم جداً (${sizeMB} MB) ويتجاوز حد الرفع في واتساب.` },
                        { quoted: m }
                    );
                }

                await sock.sendMessage(
                    remoteJid,
                    { text: `📱 *الحزمة:* ${pkgName}\n⚖️ *الحجم:* ${sizeMB} MB\n⏳ *جاري إرسال ملف الـ APK إليك...*` },
                    { quoted: m }
                );

                // إرسال الملف مباشرة من مساره في القرص لتجنب امتلاء الذاكرة مع التطبيقات الكبيرة
                await sock.sendMessage(
                    remoteJid,
                    {
                        document: { url: tempApk },
                        mimetype: 'application/vnd.android.package-archive',
                        fileName: `${pkgName}.apk`
                    },
                    { quoted: m }
                );

                setTimeout(() => {
                    if (fs.existsSync(tempApk)) fs.unlinkSync(tempApk);
                }, 15000);
            } catch (e) {
                await sock.sendMessage(
                    remoteJid,
                    { text: `❌ تعذر استخراج وإرسال التطبيق: ${e.message}` },
                    { quoted: m }
                );
            }
        });
    }
};
    
