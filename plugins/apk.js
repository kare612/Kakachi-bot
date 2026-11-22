module.exports = {
    name: 'apk',
    aliases: ['تطبيق', 'تطبيقات', 'تحميل_تطبيق'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم التطبيق بعد الأمر. مثال: `.apk WhatsApp`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: `📦 *جاري البحث عن تطبيق:* ${query}...` }, { quoted: m });

        try {
            const api = new URL('https://aptoide.com');
            api.searchParams.set('query', query);
            api.searchParams.set('limit', '1');

            const res = await fetch(api.href, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36' }
            });
            const data = await res.json();
            const app = data?.datalist?.list?.at(0);

            if (!app || !app.file?.path) {
                return sock.sendMessage(remoteJid, { text: '❌ لم يتم العثور على هذا التطبيق.' }, { quoted: m });
            }

            const sizeMB = (app.file.filesize / (1024 * 1024)).toFixed(2);
            const infoText = `📱 *تـم الـعـثـور عـلـى الـتـطـبـيـق:*\n\n` +
                             `🏷️ *الاسم:* ${app.name}\n` +
                             `📦 *الحزمة:* ${app.package}\n` +
                             `🔢 *الإصدار:* ${app.file.vername}\n` +
                             `⚖️ *الحجم:* ${sizeMB} MB\n\n` +
                             `⏳ *جاري إرسال الملف...*`;

            await sock.sendMessage(remoteJid, { text: infoText }, { quoted: m });

            if (parseFloat(sizeMB) > 45) {
                return sock.sendMessage(
                    remoteJid,
                    { text: `⚠️ حجم التطبيق كبير (${sizeMB} MB)، حمله مباشرة من الرابط:\n${app.file.path}` },
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
            await sock.sendMessage(remoteJid, { text: `❌ تعذر تحميل التطبيق حالياً (${err.message}).` }, { quoted: m });
        }
    }
};
              
