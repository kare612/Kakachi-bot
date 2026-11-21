module.exports = {
    name: 'delete',
    aliases: ['مسح', 'حذف', 'del'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo;
        if (!quoted?.stanzaId) return sock.sendMessage(remoteJid, { text: '❌ رد على الرسالة التي تريد مسحها.' }, { quoted: m });

        await sock.sendMessage(remoteJid, {
            delete: {
                remoteJid: remoteJid,
                fromMe: false,
                id: quoted.stanzaId,
                participant: quoted.participant
            }
        });
    }
};
