module.exports = {
    name: 'getpp',
    aliases: ['بروفايل', 'صورة'],
    async execute(sock, m, args, remoteJid) {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant || (m.key.participant || remoteJid);
        try {
            const ppUrl = await sock.profilePictureUrl(target, 'image');
            await sock.sendMessage(remoteJid, { image: { url: ppUrl }, caption: `👁️ *تم استخراج صورة الروح.*` }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ لا يمكن جلب الصورة (الخصوصية مفعلة أو لا توجد صورة).' }, { quoted: m });
        }
    }
};
