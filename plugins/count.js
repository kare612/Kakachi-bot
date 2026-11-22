module.exports = {
    name: 'count',
    aliases: ['عدد_الحروف', 'احصاء'],
    async execute(sock, m, args, remoteJid) {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(remoteJid, { text: '❌ اكتب النص لحساب حروفه وكلماته.' }, { quoted: m });

        const chars = text.length;
        const words = text.trim().split(/\s+/).length;
        await sock.sendMessage(
            remoteJid,
            { text: `📊 *إحصائيات النص:*\n\n🔤 *عدد الحروف:* ${chars}\n📝 *عدد الكلمات:* ${words}` },
            { quoted: m }
        );
    }
};
