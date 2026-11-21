module.exports = {
    name: 'speed',
    aliases: ['اختبار', 'فحص'],
    async execute(sock, m, args, remoteJid) {
        const t0 = performance.now();
        for (let i = 0; i < 1000000; i++) {}
        const t1 = performance.now();
        const calcSpeed = (t1 - t0).toFixed(3);

        await sock.sendMessage(
            remoteJid,
            { text: `⚡ *سرعة معالجة الظلام:* *${calcSpeed}ms*\n🟢 *الحالة:* مستقر وجاهز للأوامر.` },
            { quoted: m }
        );
    }
};
