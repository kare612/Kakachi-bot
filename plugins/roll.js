module.exports = {
    name: 'roll',
    aliases: ['نرد'],
    async execute(sock, m, args, remoteJid) {
        const num = Math.floor(Math.random() * 6) + 1;
        await sock.sendMessage(remoteJid, { text: `🎲 *تم رمي نرد القدر...*\n🌑 الرقم الظاهر: *${num}*` }, { quoted: m });
    }
};
