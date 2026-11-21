module.exports = {
    name: 'block',
    aliases: ['حظر', 'بلوك'],
    async execute(sock, m, args, remoteJid) {
        const sender = m.key.participant || remoteJid;
        if (!sender.includes('212715469251') && !m.key.fromMe) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        if (!target) return sock.sendMessage(remoteJid, { text: '❌ منشن الشخص أو اكتب رقمه لحطره.' }, { quoted: m });

        await sock.updateBlockStatus(target, 'block');
        await sock.sendMessage(remoteJid, { text: `☠️ *تم نفي الرقم إلى قائمة الحظر المظلمة.*` }, { quoted: m });
    }
};
