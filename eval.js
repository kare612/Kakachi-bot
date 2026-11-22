const util = require('util');

module.exports = {
    name: 'eval',
    aliases: ['كود', '>'],
    async execute(sock, m, args, remoteJid) {
        const sender = m.key.participant || m.key.participantAlt || remoteJid;
        const isOwner = ['212715469251', '68531186057376'].some(id => sender.includes(id)) || m.key.fromMe;
        if (!isOwner) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        const code = args.join(' ');
        if (!code) return sock.sendMessage(remoteJid, { text: '❌ اكتب كود JS لتنفيذه.' }, { quoted: m });

        try {
            let result = await eval(`(async () => { return ${code} })()`);
            if (typeof result !== 'string') result = util.inspect(result, { depth: 1 });
            await sock.sendMessage(remoteJid, { text: `⚡ *المخرجات:*\n\n${result.slice(0, 3000)}` }, { quoted: m });
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: `❌ *خطأ:* ${err.message}` }, { quoted: m });
        }
    }
};
      
