const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'setpp',
    aliases: ['صورة_المجموعة', 'تغيير_الصورة'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted ? { message: quoted } : m;
        if (!targetMsg.message?.imageMessage) {
            return sock.sendMessage(remoteJid, { text: '❌ أرسل صورة أو رد عليها بالأمر `.setpp`' }, { quoted: m });
        }

        try {
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            await sock.updateProfilePicture(remoteJid, buffer);
            await sock.sendMessage(remoteJid, { text: '🌑 *تم تحديث رمز وصورة المجموعة بنجاح.*' }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ تأكد أن البوت مشرف في المجموعة لتغيير الصورة.' }, { quoted: m });
        }
    }
};
