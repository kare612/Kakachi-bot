module.exports = {
    manage: async (sock, from, command, msg) => {
        // التحقق من أن الأمر مرسل داخل مجموعة
        if (!from.endsWith('@g.us')) {
            return await sock.sendMessage(from, { text: '❌ هذه الأوامر تعمل داخل المجموعات فقط!' });
        }

        // جلب الشخص المنشن عليه أو المقتبس رسالته
        const cited = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                      msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (!cited && ['طرد', 'رفع', 'خفض'].includes(command)) {
            return await sock.sendMessage(from, { text: '❌ يجب عليك عمل منشن أو رد (Reply) على الشخص لتنفيذ الأمر!' });
        }

        try {
            switch (command) {
                case 'طرد':
                    await sock.groupParticipantsUpdate(from, [cited], 'remove');
                    await sock.sendMessage(from, { text: '✈️ تم طرد العضو بنجاح من المجموعة.' });
                    break;

                case 'رفع':
                    await sock.groupParticipantsUpdate(from, [cited], 'promote');
                    await sock.sendMessage(from, { text: '👑 تم رفعه مشرفاً في المجموعة! تهانينا.' });
                    break;

                case 'خفض':
                    await sock.groupParticipantsUpdate(from, [cited], 'demote');
                    await sock.sendMessage(from, { text: '📉 تم تنزيل العضو وإلغاء رتبة المشرف منه.' });
                    break;

                case 'قفل':
                    await sock.groupSettingUpdate(from, 'announcement');
                    await sock.sendMessage(from, { text: '🔒 تم إغلاق المجموعة (المشرفون فقط من يمكنهم الإرسال).' });
                    break;

                case 'فتح':
                    await sock.groupSettingUpdate(from, 'not_announcement');
                    await sock.sendMessage(from, { text: '🔓 تم فتح المجموعة (الآن يمكن للجميع المشاركة والإرسال).' });
                    break;
            }
        } catch (err) {
            await sock.sendMessage(from, { text: '❌ فشل تنفيذ الأمر. تأكد أن البوت مشرف ولديه الصلاحيات الكاملة.' });
        }
    }
};
