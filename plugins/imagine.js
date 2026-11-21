module.exports = {
    name: 'imagine',
    aliases: ['رسم', 'تخيل'],
    async execute(sock, m, args, remoteJid) {
        const prompt = args.join(' ');
        if (!prompt) return sock.sendMessage(remoteJid, { text: '❌ اكتب وصف الصورة التي تريد رسمها (يفضل بالإنجليزية لدقة أعلى).' }, { quoted: m });

        await sock.sendMessage(remoteJid, { text: '🎨 *جاري تجسيد خيالك في لوحة مظلمة...*' }, { quoted: m });
        const imageUrl = `https://pollinations.ai{encodeURIComponent(prompt)}?nologo=true`;
        await sock.sendMessage(remoteJid, { image: { url: imageUrl }, caption: `🔮 *تم الرسم:* ${prompt}` }, { quoted: m });
    }
};
