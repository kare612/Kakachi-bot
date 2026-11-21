const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'take',
    aliases: ['سرقة', 'حقوق'],
    async execute(sock, m, args, remoteJid) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.stickerMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ رد على أي ملصق بالأمر `.take`' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            await sock.sendMessage(remoteJid, { sticker: buffer }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تعذر نسخ الملصق.' }, { quoted: m });
        }
    }
};
