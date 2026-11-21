module.exports = {
    name: 'add',
    aliases: ['اضافة', 'ضيف'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        const number = args.join('').replace(/[^0-9]/g, '');
        if (!number) return sock.sendMessage(remoteJid, { text: '❌ اكتب رقم الشخص مع رمز الدولة. مثال: `.add 212600000000`' }, { quoted: m });

        try {
            await sock.groupParticipantsUpdate(remoteJid, [number + '@s.whatsapp.net'], 'add');
            await sock.sendMessage(remoteJid, { text: `🕷️ *تم استدعاء الروح الجديدة إلى المجموعة.*` }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر إضافته (ربما خصوصيته تمنع الإضافة أو البوت ليس مشرفاً).' }, { quoted: m });
        }
    }
};
