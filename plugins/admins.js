module.exports = {
    name: 'admins',
    aliases: ['المشرفين', 'ادمن'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        const meta = await sock.groupMetadata(remoteJid);
        const admins = meta.participants.filter(p => p.admin).map(p => p.id);
        const note = args.join(' ') || 'استدعاء عاجل للمشرفين!';

        let text = `👑 *نـداء إلـى حـراس الـظـلام (المشرفين):*\n📝 ${note}\n\n`;
        admins.forEach(a => text += `🗡️ @${a.split('@')[0]}\n`);

        await sock.sendMessage(remoteJid, { text, mentions: admins }, { quoted: m });
    }
};
