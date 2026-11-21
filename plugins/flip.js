module.exports = {
    name: 'flip',
    aliases: ['عملة', 'قرعة'],
    async execute(sock, m, args, remoteJid) {
        const result = Math.random() < 0.5 ? '👑 ملك (وجه)' : '📜 كتابة (ظهر)';
        await sock.sendMessage(remoteJid, { text: `🪙 *دارت العملة في الظلام وسقطت على:*\n\n*${result}*` }, { quoted: m });
    }
};
