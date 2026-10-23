module.exports = {
    name: 'الاوامر', // الاسم الرئيسي للأمر
    aliases: ['منيو', 'menu', 'اوامر'], // اختصارات لتشغيل الملف
    description: 'عرض قائمة الأوامر وإدارة المجموعات الأساسية',

    async execute(sock, m, args, remoteJid) {
        // الحصول على نص الرسالة المكتوبة
        const messageContent = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = messageContent.split(' ')[0].toLowerCase().slice(1); // استخراج اسم الأمر بدون النقطة

        // 1. أمر عرض القائمة (المنيو)
        if (['الاوامر', 'منيو', 'menu', 'اوامر'].includes(commandUsed)) {
            const menuText = `
✨ *قائمة أوامر بوت كاكاشي* ✨

⚙️ *الأوامر العامة:*
• *.منيو* / *.الاوامر* ⇽ لعرض هذه القائمة.
• *.ايدي* ⇽ لعرض المعرف الخاص بك أو بالروم.

👥 *أوامر المجموعات (للمشرفين):*
• *.القروب* ⇽ لعرض معلومات المجموعة الحالية.
• *.طرد* ⇽ لطرد عضو عبر الرد على رسالته.

🤖 _Kakashi Bot v1.0_
`.trim();

            return await sock.sendMessage(remoteJid, { text: menuText }, { quoted: m });
        }

        // 2. أمر عرض الآيدي (ID)
        if (commandUsed === 'ايدي') {
            const sender = m.key.participant || m.key.remoteJid;
            const idText = `📌 *معلومات المعرف:*
            
👥 *آيدي المحادثة:* ${remoteJid}
👤 *آيدي الحساب:* ${sender.split('@')[0]}`;

            return await sock.sendMessage(remoteJid, { text: idText }, { quoted: m });
        }

        // 3. أمر معلومات المجموعة
        if (commandUsed === 'القروب') {
            if (!remoteJid.endsWith('@g.us')) {
                return await sock.sendMessage(remoteJid, { text: '❌ هذا الأمر يعمل داخل المجموعات فقط!' }, { quoted: m });
            }

            const groupMetadata = await sock.groupMetadata(remoteJid);
            const groupText = `
📝 *معلومات المجموعة:*

🏷️ *الاسم:* ${groupMetadata.subject}
🆔 *الآيدي:* ${groupMetadata.id}
👥 *عدد الأعضاء:* ${groupMetadata.participants.length}
👑 *المالك:* @${groupMetadata.owner ? groupMetadata.owner.split('@')[0] : 'غير معروف'}
`.trim();

            return await sock.sendMessage(remoteJid, { text: groupText, mentions: groupMetadata.owner ? [groupMetadata.owner] : [] }, { quoted: m });
        }

        // 4. أمر الطرد (يتطلب الرد على رسالة الشخص المراد طرده)
        if (commandUsed === 'طرد') {
            if (!remoteJid.endsWith('@g.us')) {
                return await sock.sendMessage(remoteJid, { text: '❌ هذا الأمر يعمل داخل المجموعات فقط!' }, { quoted: m });
            }

            // التأكد من أن المستخدم رد على رسالة شخص ما
            const quotedMessage = m.message?.extendedTextMessage?.contextInfo;
            if (!quotedMessage || !quotedMessage.participant) {
                return await sock.sendMessage(remoteJid, { text: '⚠️ الرجاء الرد على رسالة العضو الذي تريد طرده وكتابة *.طرد*' }, { quoted: m });
            }

            const targetParticipant = quotedMessage.participant;

            try {
                // إرسال طلب الطرد لواتساب
                await sock.groupParticipantsUpdate(remoteJid, [targetParticipant], 'remove');
                return await sock.sendMessage(remoteJid, { text: `✅ تم طرد العضو بنجاح.` }, { quoted: m });
            } catch (error) {
                return await sock.sendMessage(remoteJid, { text: '❌ فشل الطرد. تأكد أن البوت يملك صلاحيات المشرف (Admin) في المجموعة.' }, { quoted: m });
            }
        }
    }
};
