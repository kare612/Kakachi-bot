export default {
    command: ['طرد', 'kick'],
    category: 'group',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        
        if (!chatJid.endsWith('@g.us')) {
            return await sock.sendMessage(chatJid, { text: '❌ هذا الأمر يعمل داخل المجموعات فقط!' }, { quoted: msg });
        }
        
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length === 0) {
            return await sock.sendMessage(chatJid, { text: '❌ يرجى عمل منشن (@) للعضو المراد طرده!' }, { quoted: msg });
        }
        
        try {
            await sock.groupParticipantsUpdate(chatJid, [mentioned[0]], 'remove');
            await sock.sendMessage(chatJid, { text: '✅ تم إزالة العضو بنجاح من المجموعه.' }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatJid, { text: '❌ فشل الطرد، تأكد أن البوت يمتلك صلاحيات المشرف!' }, { quoted: msg });
        }
    }
};
