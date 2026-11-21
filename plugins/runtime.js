module.exports = {
    name: 'runtime',
    aliases: ['المدة', 'وقت'],
    async execute(sock, m, args, remoteJid) {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const text = `⏳ *مدة استيقاظ البوت:*\n${hours} ساعة، ${minutes} دقيقة، و ${seconds} ثانية.`;
        await sock.sendMessage(remoteJid, { text }, { quoted: m });
    }
};
