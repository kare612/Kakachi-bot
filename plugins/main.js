export default async function ({ command, args, isOwner, reply, OWNER_NAME, PREFIX, sock, from, sender }) {
    switch (command) {
        case 'الاوامر':
        case 'menu':
            await reply(`🌟 𝙆𝘼𝙆𝘼𝘾𝙃𝙄 - 𝙈𝙀𝙉𝙐 𝙈𝙐𝙇𝙏𝙄-𝘽𝙊🇹 🌟

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
│ 🔒 ${PREFIX}قفل - قفل المجموعة للمشرفين
│ 🔓 ${PREFIX}فتح - فتح المجموعة للجميع
└──────────────┘`);
            break;

        case 'قفل':
            if (!from.endsWith('@g.us')) return reply("❌ هذا الأمر للمجموعات فقط!");
            try {
                // فحص الصلاحيات لتفادي أخطاء 401 Not Authorized
                const groupMetadata = await sock.groupMetadata(from);
                const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                const isBotAdmin = groupMetadata.participants.find(p => p.id === botJid)?.admin;
                
                if (!isBotAdmin) return reply("❌ لست مشرفاً (Admin) في هذه المجموعة لتنفيذ الأمر!");
                
                await sock.groupSettingUpdate(from, 'announcement');
                await reply("🔒 تم إغلاق المجموعة بنجاح.");
            } catch (err) {
                await reply("❌ تعذر تنفيذ الأمر، تأكد من صلاحيات البوت.");
            }
            break;

        case 'فتح':
            if (!from.endsWith('@g.us')) return reply("❌ هذا الأمر للمجموعات فقط!");
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                const isBotAdmin = groupMetadata.participants.find(p => p.id === botJid)?.admin;
                
                if (!isBotAdmin) return reply("❌ لست مشرفاً (Admin) في هذه المجموعة لتنفيذ الأمر!");
                
                await sock.groupSettingUpdate(from, 'not_announcement');
                await reply("🔓 تم فتح المجموعة بنجاح.");
            } catch (err) {
                await reply("❌ تعذر تنفيذ الأمر.");
            }
            break;

        default:
            break;
    }
}
