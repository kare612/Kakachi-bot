module.exports = {
    name: 'apk',
    aliases: ['تطبيق', 'تطبيقات', 'تحميل_تطبيق'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم التطبيق بالإنجليزية بشكل صحيح. مثال: `.apk Facebook Lite`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: `📦 *جاري البحث عن تطبيق:* ${query}...` }, { quoted: m });

        try {
            const api = new URL('https://aptoide.com');
            api.searchParams.set('query', query);
            api.searchParams.set('limit', '1');

            const res = await fetch(api.href, {
                headers: {
                    'User-Agent': 'Aptoide/9.20.6.1 (Linux; Android 13)',
                    'Accept': 'application/json'
                }
            });

            const rawText = await res.text();
            if (rawText.trim().startsWith('<')) {
                throw new Error('الخادم رفض الطلب مؤقتاً، تأكد من كتابة اسم التطبيق بالإنجليزية بشكل صحيح');
            }

            const data = JSON.parse(rawText);
            const app = data?.datalist?.list?.at(0);

            if (!app || !app.file?.path) {
                return sock.sendMessage(remoteJid, { text: '❌ لم يتم العثور على التطبيق، تأكد من كتابة اسمه بشكل صحيح (مثال: `Facebook` أو `Free Fire`).' }, { quoted: m });
            }

            const sizeMB = (app.file.filesize / (1024 * 1024)).toFixed(2);
            const infoText = `📱 *تـم الـعـثـور عـلـى الـتـطـبـيـق:*\n\n` +
                             `🏷️ *الاسم:* ${app.name}\n` +
                             `📦 *الحزمة:* ${app.package}\n` +
                             `🔢 *الإصدار:* ${app.file.vername}\n` +
                             `⚖️ *الحجم:* ${sizeMB} MB\n\n` +
                             `⏳ *جاري التحضير...*`;

            await sock.sendMessage(remoteJid, { text: infoText }, { quoted: m });

            if (parseFloat(sizeMB) > 45) {
                return sock.sendMessage(
                    remoteJid,
                    { text: `⚠️ حجم التطبيق كبير (${sizeMB} MB)، حمله مباشرة من هذا الرابط:\n${app.file.path}` },
                    { quoted: m }
                );
            }

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
            const searchLink = 'https://apkpure.com' + encodeURIComponent(query);
            await sock.sendMessage(
                remoteJid,
                { text: `⚠️ تعذر سحب الملف مباشرة (${err.message}).\n\n🔗 *يمكنك تحميله مباشرة من هنا:*\n${searchLink}` },
                { quoted: m }
            );
        }
    }
};
