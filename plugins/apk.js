const axios = require('axios');

module.exports = {
    name: 'apk',
    aliases: ['تطبيق', 'تطبيقات', 'app', 'برنامج'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(
                remoteJid,
                { text: '❌ اكتب اسم التطبيق بعد الأمر.\nمثال: `.تطبيق واتساب` أو `.apk minecraft`' },
                { quoted: m }
            );
        }

        await sock.sendMessage(remoteJid, { text: `🔍 *جاري البحث عن تطبيق:* ${query}...` }, { quoted: m });

        try {
            // البحث في قاعدة بيانات Aptoide المجانية
            const searchUrl = `https://aptoide.com{encodeURIComponent(query)}&limit=1`;
            const { data } = await axios.get(searchUrl);

            const app = data?.datalist?.list?.[0];
            if (!app || !app.file?.path) {
                return sock.sendMessage(
                    remoteJid,
                    { text: '❌ لم يتم العثور على التطبيق المطلوب، جرب كتابة الاسم بالإنجليزية.' },
                    { quoted: m }
                );
            }

            // حساب حجم التطبيق بالميجابايت
            const sizeInMB = (app.file.filesize / (1024 * 1024)).toFixed(2);

            // حماية السيرفر و Termux من توقف الرام إذا كان التطبيق كبيراً جداً
            if (parseFloat(sizeInMB) > 100) {
                return sock.sendMessage(
                    remoteJid,
                    {
                        text: `⚠️ حجم تطبيق *${app.name}* كبير جداً (${sizeInMB} MB).\n📥 يمكنك تحميله مباشرة من الرابط:\n${app.file.path}`
                    },
                    { quoted: m }
                );
            }

            // إرسال معلومات التطبيق وصورته قبل رفع الملف
            const caption = `📱 *اسم التطبيق:* ${app.name}\n📦 *الإصدار:* ${app.file.vername || 'غير محدد'}\n⚖️ *الحجم:* ${sizeInMB} MB\n⏳ *جاري رفع وإرسال ملف APK...*`;
            
            if (app.icon) {
                await sock.sendMessage(remoteJid, { image: { url: app.icon }, caption }, { quoted: m });
            } else {
                await sock.sendMessage(remoteJid, { text: caption }, { quoted: m });
            }

            // إرسال ملف التطبيق بصيغة APK مباشرة عبر الرابط
            await sock.sendMessage(
                remoteJid,
                {
                    document: { url: app.file.path },
                    mimetype: 'application/vnd.android.package-archive',
                    fileName: `${app.name}.apk`
                },
                { quoted: m }
            );

        } catch (err) {
            await sock.sendMessage(
                remoteJid,
                { text: `❌ حدث خطأ أثناء جلب التطبيق: ${err.message}` },
                { quoted: m }
            );
        }
    }
};
                
