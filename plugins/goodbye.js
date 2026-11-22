module.exports = {
    name: 'goodbye',
    aliases: ['الوداع', 'وداع'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) {
            return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });
        }

        global.goodbyeGroups = global.goodbyeGroups || {};
        const option = args.at(0)?.toLowerCase();

        if (option === 'on' || option === 'تفعيل') {
            global.goodbyeGroups[remoteJid] = true;
            return sock.sendMessage(remoteJid, { text: '🌑 *تم تفعيل رسالة الوداع بصورة الملف الشخصي في هذه المجموعة.*' }, { quoted: m });
        } else if (option === 'off' || option === 'ايقاف') {
            global.goodbyeGroups[remoteJid] = false;
            return sock.sendMessage(remoteJid, { text: '🕯️ *تم إيقاف رسالة الوداع.*' }, { quoted: m });
        } else {
            return sock.sendMessage(remoteJid, { text: '⚙️ اكتب `.goodbye تفعيل` أو `.goodbye ايقاف`' }, { quoted: m });
        }
    },

    // دالة إرسال الوداع بصورة البروفايل عند مغادرة أو طرد عضو
    async onLeave(sock, groupId, participants) {
        if (!global.goodbyeGroups?.[groupId]) return;

        const meta = await sock.groupMetadata(groupId);
        const fallbackImg = 'https://ibb.co';

        for (const user of participants) {
            let ppUrl;
            try {
                ppUrl = await sock.profilePictureUrl(user, 'image');
            } catch {
                ppUrl = fallbackImg;
            }

            const caption = `🕯️ ───『 *وداعـاً مـن الـظـلال* 』─── 🕯️\n\n` +
                            `👤 *المغادر:* @${user.split('@').at(0)}\n` +
                            `🏰 *المجموعة:* ${meta.subject}\n` +
                            `👥 *المتبقون:* ${meta.participants.length}\n\n` +
                            `🌑 *غادر أحدهم عالم الظلام...*`;

            try {
                await sock.sendMessage(groupId, { image: { url: ppUrl }, caption, mentions: [user] });
            } catch {
                await sock.sendMessage(groupId, { text: caption, mentions: [user] });
            }
        }
    }
};
  
