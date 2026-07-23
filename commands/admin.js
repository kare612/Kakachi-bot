export default async function ({ command, args, isOwner, reply, DEVELOPER_NUMBER, BOT_NAME, OWNER_NAME, PREFIX, sock, from, sender, mek }) {
    switch (command) {
        case 'الاوامر':
        case 'menu':
        case 'help':
            return reply(`🌟 𝙆𝘼𝙆𝘼𝘾𝙃𝙄 - 𝙈𝙀𝙉𝙐 𝙈𝙐𝙇𝙏𝙄-𝘽𝙊𝙏 🌟

👑 𝗠𝗢𝗗𝗘: ${isOwner ? '𝗠𝗮𝘀𝘁𝗲𝗿 (المطور)' : '𝗨𝘀𝗲𝗿 (مستخدم)'}
🔮 𝗣𝗥𝗘𝗙𝗜𝗫: [ ${PREFIX} ]

📥 *أقسام التحميل والـ AI:*
┌──────────────┐
│ 🤖 ${PREFIX}ذكاء [السؤال] - التحدث مع الذكاء الاصطناعي
│ 📹 ${PREFIX}فيديو [الرابط] - تحميل فيديو تيك توك/يوتيوب
│ 🎵 ${PREFIX}صوت [الرابط] - تحميل الأغاني والمقاطع
└──────────────┘

🎮 *نظام النقاط والألعاب:*
┌──────────────┐
│ 🎮 ${PREFIX}العاب - فتح قائمة التسلية والألعاب
│ 📊 ${PREFIX}نقاطي - عرض رصيدك من النقاط
│ 🎁 ${PREFIX}هدية - الحصول على نقاط مجانية
└──────────────┘

⚙️ *أوامر التحكم والمجموعات:*
┌──────────────┐
│ 🔒 ${PREFIX}قفل - قفل إرسال الرسائل بالمجموعة
│ 🔓 ${PREFIX}فتح - فتح إرسال الرسائل بالمجموعة
│ 🚷 ${PREFIX}طرد [@منشن] - إزالة عضو من المجموعة
└──────────────┘

💡 _تم التطوير بواسطة: ${OWNER_NAME}_`);

        case 'بينج':
        case 'ping':
            return reply(`🚀 *جـااااري الفـحـص...*\n⏱️ البوت يعمل بأعلى كفاءة وسرعة استجابة هائلة!`);

        case 'المعلومات':
        case 'info':
            return reply(`📝 *مواصفات النظام الخاص بك:*\n\n⚙️ *الاسم:* ${BOT_NAME}\n👑 *المطور:* ${OWNER_NAME}\n🌐 *الرقم:* +${DEVELOPER_NUMBER}\n📌 *النظام:* Termux Node.js`);

        case 'قفل':
            if (!from.endsWith('@g.us')) return reply("❌ هذا الأمر يعمل داخل المجموعات فقط!");
            await sock.groupSettingUpdate(from, 'announcement');
            return reply("🔒 تم إغلاق المجموعة بنجاح. الآن يمكن للمشرفين فقط إرسال الرسائل.");

        case 'فتح':
            if (!from.endsWith('@g.us')) return reply("❌ هذا الأمر يعمل داخل المجموعات فقط!");
            await sock.groupSettingUpdate(from, 'not_announcement');
            return reply("🔓 تم فتح المجموعة بنجاح. الآن يمكن للجميع إرسال الرسائل.");

        case 'طرد':
        case 'kick':
            if (!from.endsWith('@g.us')) return reply("❌ هذا الأمر يعمل داخل المجموعات فقط!");
            const mention = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!mention) return reply("❌ يرجى عمل منشن (@) للعضو المراد طرده.");
            await sock.groupParticipantsUpdate(from, [mention], 'remove');
            return reply("🚷 تم طرد العضو المحدد بنجاح من المجموعة.");

        case 'نشر':
        case 'broadcast':
            if (!isOwner) return reply("❌ عذراً، هذا الأمر مخصص فقط لمطور البوت العظيم.");
            if (args.length < 1) return reply(`❌ يرجى كتابة نص الرسالة بعد الأمر، مثال:\n${PREFIX}نشر أهلاً بالجميع`);
            return reply(`📢 *جاري إرسال إعلان المطور لجميع المحادثات...*\n\nالنص: ${args.join(" ")}`);

        default:
            break;
    }
}
