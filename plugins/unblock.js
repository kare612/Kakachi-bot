module.exports = {
    name: 'unblock',
    aliases: ['فك_الحظر', 'الغاء_الحظر'],
    async execute(sock, m, args, remoteJid) {
        const sender = m.key.participant || m.key.participantAlt || remoteJid;
        const isOwner = ['212715469251', '68531186057376'].some(id => sender.includes(id)) || m.key.fromMe;

        if (!isOwner) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        if (!target) return sock.sendMessage(remoteJid, { text: '❌ منشن الشخص أو اكتب رقمه لفك الحظر.' }, { quoted: m });

        await sock.updateBlockStatus(target, 'unblock');
        await sock.sendMessage(remoteJid, { text: `🕯️ *تم العفو عنه ورفع الحظر.*` }, { quoted: m });
    }
};
                                           
