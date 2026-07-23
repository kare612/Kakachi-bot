export default async function ({ command, args, isOwner, reply, OWNER_NAME, PREFIX, sock, from }) {
    switch (command) {
        case 'الاوامر':
        case 'menu':
            await reply(`🌟 𝙆𝘼𝙆𝘼𝘾𝙃𝙄 - 𝙈𝙀𝙉𝙐 𝙈𝙐𝙇𝙏ิ𝙄-𝘽𝙊𝙏 🌟

🔮 𝗣𝗥𝗘𝗙𝗜𝗫: [ ${PREFIX} ]

🎵 *الصوتيات والتحميل عبر الـ API:*
┌──────────────┐
│ 🎧 ${PREFIX}صوت [الرابط] - تحميل من يوتيوب
│ 📹 ${PREFIX}فيديو [الرابط] - تحميل تيك توك
│ 🗣️ ${PREFIX}قول [النص] - تحويل النص لصوت
└──────────────┘

🎮 *الألعاب والتسلية:*
┌──────────────┐
│ 🎮 ${PREFIX}العاب - فتح الألعاب
│ 🪙 ${PREFIX}نقاطي - رصيدك
└──────────────┘

🔒 *التحكم بالمجموعات:*
┌──────────────┐
│ 🔒 ${PREFIX}قفل - قفل المجموعة
│ 🔓 ${PREFIX}فتح - فتح المجموعة
└──────────────┘`);
            break;

        case 'قفل':
            if (!from.endsWith('@g.us')) return reply("❌ هذا الأمر للمجموعات فقط!");
            await sock.groupSettingUpdate(from, 'announcement');
            await reply("🔒 تم إغلاق المجموعة بنجاح.");
            break;

        case 'فتح':
            if (!from.endsWith('@g.us')) return reply("❌ هذا الأمر للمجموعات فقط!");
            await sock.groupSettingUpdate(from, 'not_announcement');
            await reply("🔓 تم فتح المجموعة بنجاح.");
            break;

        default:
            break;
    }
}
