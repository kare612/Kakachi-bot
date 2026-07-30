export default {
    command: ['قفل', 'فتح', 'طرد', 'رفع_مشرف'],
    category: 'group',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        const isGroup = chatJid.endsWith('@g.us');
        
        if (!isGroup) return await sock.sendMessage(chatJid, { text: '❌ هذا الأمر يعمل داخل المجموعات فقط!' }, { quoted: msg });

        const userCommand = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const metadata = await sock.groupMetadata(chatJid);
        const participants = metadata.participants;
        
        // التحقق من منشن العضو
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (/قفل/i.test(userCommand)) {
            await sock.groupSettingUpdate(chatJid, 'announcement');
            return await sock.sendMessage(chatJid, { text: '🔒 تم إغلاق الشات، المجموعه الآن للمشرفين فقط.' }, { quoted: msg });
        }
        
        if (/فتح/i.test(userCommand)) {
            await sock.groupSettingUpdate(chatJid, 'not_announcement');
            return await sock.sendMessage(chatJid, { text: '🔓 تم فتح الشات، يمكن للجميع إرسال الرسائل الآن.' }, { quoted: msg });
        }

        if (!mentionedJid) return await sock.sendMessage(chatJid, { text: '⚠️ يرجى الإشارة (منشن) للعضو المطلوب!' }, { quoted: msg });

        if (/طرد/i.test(userCommand)) {
            await sock.groupParticipantsUpdate(chatJid, [mentionedJid], 'remove');
            return await sock.sendMessage(chatJid, { text: '✅ تم طرد العضو بنجاح من المجموعة.' }, { quoted: msg });
        }

        if (/رفع_مشرف/i.test(userCommand)) {
            await sock.groupParticipantsUpdate(chatJid, [mentionedJid], 'promote');
            return await sock.sendMessage(chatJid, { text: '✨ تم ترقية العضو إلى مشرف بنجاح.' }, { quoted: msg });
        }
    }
};
