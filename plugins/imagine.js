module.exports = {
    name: 'imagine',
    aliases: ['رسم', 'تخيل'],
    async execute(sock, m, args, remoteJid) {
        const prompt = args.join(' ');
        if (!prompt) return sock.sendMessage(remoteJid, { text: '❌ اكتب وصف الصورة التي تريد رسمها (يفضل بالإنجليزية).' }, { quoted: m });

        await sock.sendMessage(remoteJid, { text: '🎨 *جاري تجسيد خيالك في لوحة مظلمة...*' }, { quoted: m });

        try {
            const url = new URL('https://pollinations.ai' + encodeURIComponent(prompt));
            url.searchParams.set('nologo', 'true');

            await sock.sendMessage(remoteJid, { image: { url: url.href }, caption: `🔮 *تم الرسم:* ${prompt}` }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ فشل توليد الصورة حالياً، حاول مجدداً.' }, { quoted: m });
        }
    }
};
