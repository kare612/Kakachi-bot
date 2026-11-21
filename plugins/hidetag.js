module.exports = {
    name: 'hidetag',
    aliases: ['مخفي', 'منشن'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) {
            return sock.sendMessage(remoteJid, { text: '❌ هذا الأمر يعمل في المجموعات فقط.' }, { quoted: m });
        }
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const participants = groupMetadata.participants.map(p => p.id);
        const messageText = args.join(' ') || '🌑 استدعاء من الظلام للجميع!';

        await sock.sendMessage(
            remoteJid,
            { text: messageText, mentions: participants },
            { quoted: m }
        );
    }
};
