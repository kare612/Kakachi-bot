module.exports = {
    name: 'hack',
    aliases: ['تهكير', 'اختراق'],
    async execute(sock, m, args, remoteJid) {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.sender;
        const text = `💻 *جاري اختراق الهدف:* @${target.split('@')[0]}...\n` +
                     `🔓 تم تجاوز جدار الحماية...\n` +
                     `📂 جاري سحب المحادثات والصور السرية...\n` +
                     `✅ *تم الاختراق بنجاح (100%)* ☠️`;
        await sock.sendMessage(remoteJid, { text, mentions: [target] }, { quoted: m });
    }
};
