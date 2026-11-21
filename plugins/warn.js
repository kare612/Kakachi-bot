module.exports = {
    name: 'warn',
    aliases: ['انذار', 'تحذير'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return sock.sendMessage(remoteJid, { text: '❌ منشن الشخص أو رد على رسالته لتوجيه إنذار له.' }, { quoted: m });

        const reason = args.filter(a => !a.startsWith('@')).join(' ') || 'مخالفة قوانين المجموعة';
        await sock.sendMessage(
            remoteJid,
            {
                text: `⚠️ *إنـذار مـظـلـم* ⚠️\n\n👤 *العضو:* @${target.split('@')[0]}\n📜 *السبب:* ${reason}\n\n🕯️ *احذر، تكرار المخالفة يعني النفي!*`,
                mentions: [target]
            },
            { quoted: m }
        );
    }
};
