module.exports = {
    name: 'broadcast',
    aliases: ['اذاعة', 'نشر', 'bc'],
    async execute(sock, m, args, remoteJid) {
        const sender = m.key.participant || m.key.participantAlt || remoteJid;
        const isOwner = ['212715469251', '68531186057376'].some(id => sender.includes(id)) || m.key.fromMe;
        if (!isOwner) return sock.sendMessage(remoteJid, { text: '⛔ هذا الأمر للمطور فقط.' }, { quoted: m });

        const msg = args.join(' ');
        if (!msg) return sock.sendMessage(remoteJid, { text: '❌ اكتب الرسالة التي تريد إذاعتها لجميع المجموعات.' }, { quoted: m });

        const groups = Object.keys(await sock.groupFetchAllParticipating());
        for (const id of groups) {
            await sock.sendMessage(id, { text: `📢 *إعـلان مـن الـمـطـور:*\n\n${msg}` });
        }

        await sock.sendMessage(remoteJid, { text: `✅ *تم إرسال الإذاعة بنجاح إلى (${groups.length}) مجموعة.*` }, { quoted: m });
    }
};
