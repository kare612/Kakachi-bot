const { exec } = require('child_process');

module.exports = {
    name: 'exec',
    aliases: ['طرفية', '$'],
    async execute(sock, m, args, remoteJid) {
        const sender = m.key.participant || m.key.participantAlt || remoteJid;
        const isOwner = ['212715469251', '68531186057376'].some(id => sender.includes(id)) || m.key.fromMe;
        if (!isOwner) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        const cmd = args.join(' ');
        if (!cmd) return sock.sendMessage(remoteJid, { text: '❌ اكتب الأمر البرمجي للتنفيذ.' }, { quoted: m });

        exec(cmd, async (err, stdout, stderr) => {
            const output = stdout || stderr || (err ? err.message : '✅ تم التنفيذ بدون مخرجات.');
            await sock.sendMessage(remoteJid, { text: `💻 *النتيجة:*\n\n${output.slice(0, 3000)}` }, { quoted: m });
        });
    }
};
                                                                                                 
