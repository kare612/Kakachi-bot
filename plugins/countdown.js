module.exports = {
    name: 'countdown',
    aliases: ['عد_تنازلي', 'مؤقت'],
    async execute(sock, m, args, remoteJid) {
        let sec = parseInt(args.at(0)) || 5;
        if (sec > 15) sec = 15;
        if (sec < 1) sec = 3;

        const sent = await sock.sendMessage(remoteJid, { text: `⏳ *العد التنازلي:* ${sec}...` }, { quoted: m });
        for (let i = sec - 1; i >= 1; i--) {
            await new Promise(r => setTimeout(r, 1000));
            await sock.sendMessage(remoteJid, { text: `⏳ *العد التنازلي:* ${i}...`, edit: sent.key });
        }
        await new Promise(r => setTimeout(r, 1000));
        await sock.sendMessage(remoteJid, { text: `🔥 *انـتـهـى الـوقـت!*`, edit: sent.key });
    }
};
