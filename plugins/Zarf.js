module.exports = {
    name: 'زرف',
    category: 'owner',
    desc: 'طرد جميع الأعضاء وتغيير اسم وصورة المجموعة.',
    async execute(client, message, args) {
        const { from, isGroup, sender } = message;

        // 1. التحقق من أن الأمر يُنفذ داخل مجموعة
        if (!isGroup) {
            return client.sendMessage(from, { text: '❌ هذا الأمر يعمل داخل المجموعات فقط!' });
        }

        // 2. التحقق من الصلاحيات (يجب أن يكون البوت مشرفاً ليتمكن من الطرد والتعديل)
        const groupMetadata = await client.groupMetadata(from);
        const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
        const botIsAdmin = groupMetadata.participants.find(p => p.id === botId)?.admin;

        if (!botIsAdmin) {
            return client.sendMessage(from, { text: '❌ يجب أن أكون مشرفاً (Admin) في المجموعة لتنفيذ هذا الأمر!' });
        }

        try {
            // [أ] تغيير اسم المجموعة إلى "غبيمارو زرف" مزخرف
            const newName = '⚡ 𝙂𝙖𝙗𝙞𝙢𝙖𝙧𝙪 𝙕𝙖𝙧𝙛 ⚡'; 
            await client.groupUpdateSubject(from, newName);

            // [ب] تغيير صورة المجموعة
            // ملاحظة: يجب وضع رابط مباشر لصورة صالحة أو مسار صورة محلي هنا
            const imageUrl = 'https://telegra.ph'; 
            await client.groupUpdateProfilePicture(from, { url: imageUrl });

            // [ج] جلب قائمة الأعضاء وتصفيتهم (طرد الجميع ما عدا المشرفين)
            const participants = groupMetadata.participants;
            const toEvict = [];

            for (let participant of participants) {
                // إذا لم يكن العضو مشرفاً (لا admin ولا superadmin)، يتم إضافته لقائمة الطرد
                if (!participant.admin) {
                    toEvict.push(participant.id);
                }
            }

            // تنفيذ عملية الطرد جماعياً
            if (toEvict.length > 0) {
                await client.groupParticipantsUpdate(from, toEvict, 'remove');
                await client.sendMessage(from, { text: `✅ تم بنجاح زرف المجموعة وطرد ${toEvict.length} عضو غير مشرف!` });
            } else {
                await client.sendMessage(from, { text: '⚠️ لا يوجد أعضاء عاديين لطردهم، المجموعة تحتوي على مشرفين فقط.' });
            }

        } catch (error) {
            console.error(error);
            await client.sendMessage(from, { text: `❌ حدث خطأ أثناء تنفيذ الأمر: ${error.message}` });
        }
    }
};
