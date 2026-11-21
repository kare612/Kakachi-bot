module.exports = {
    name: 'ai',
    aliases: ['gpt', 'ذكاء', 'اسأل'],
    async execute(sock, m, args, remoteJid) {
        const prompt = args.join(' ');
        if (!prompt) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب سؤالك للذكاء الاصطناعي. مثال: `.ai من أنت؟`' }, { quoted: m });
        }

        await sock.sendMessage(remoteJid, { text: '🕯️ *جاري استحضار الإجابة من أعماق الظلام...*' }, { quoted: m });

        try {
            // الخادم الأول: واجهة ذكاء اصطناعي سريعة ومجانية
            const res = await fetch('https://siputzx.my.id' + encodeURIComponent(prompt));
            const data = await res.json();

            if (data && data.data) {
                return await sock.sendMessage(remoteJid, { text: `🧠 *الذكاء المظلم:*\n\n${data.data}` }, { quoted: m });
            }
            throw new Error('Fallback');
        } catch {
            try {
                // الخادم الاحتياطي الثاني في حال تعذر الأول
                const res2 = await fetch('https://dorratz.com' + encodeURIComponent(prompt));
                const data2 = await res2.json();

                if (data2 && (data2.result || data2.message)) {
                    return await sock.sendMessage(remoteJid, { text: `🧠 *الذكاء المظلم:*\n\n${data2.result || data2.message}` }, { quoted: m });
                }
                throw new Error('Failed');
            } catch {
                await sock.sendMessage(
                    remoteJid,
                    { text: '❌ تعذر الاتصال بخوادم الذكاء الاصطناعي حالياً. (تأكد من أن باقة الإنترنت تسمح بالوصول للمواقع الخارجية أو أوقف الـ VPN).' },
                    { quoted: m }
                );
            }
        }
    }
};
