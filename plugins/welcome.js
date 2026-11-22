module.exports = {
    name: 'welcome',
    aliases: ['الترحيب', 'ترحيب'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) {
            return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });
        }

        global.welcomeGroups = global.welcomeGroups || {};
        const option = args.at(0)?.toLowerCase();

        if (option === 'on' || option === 'تفعيل') {
            global.welcomeGroups[remoteJid] = true;
            return sock.sendMessage(remoteJid, { text: '🌑 *تم تفعيل الترحيب بصورة الملف الشخصي في هذه المجموعة.*' }, { quoted: m });
        } else if (option === 'off' || option === 'ايقاف') {
            global.welcomeGroups[remoteJid] = false;
            return sock.sendMessage(remoteJid, { text: '🕯️ *تم إيقاف الترحيب.*' }, { quoted: m });
        } else {
            return sock.sendMessage(remoteJid, { text: '⚙️ اكتب `.welcome تفعيل` أو `.welcome ايقاف`' }, { quoted: m });
        }
    },

    // دالة إرسال الترحيب بصورة البروفايل عند دخول عضو جديد
    async onJoin(sock, groupId, participants) {
        if (!global.welcomeGroups?.[groupId]) return;

        const meta = await sock.groupMetadata(groupId);
        const fallbackImg = 'https://ibb.co';

        for (const user of participants) {
            let ppUrl;
            try {
                ppUrl = await sock.profilePictureUrl(user, 'image');
            } catch {
                ppUrl = fallbackImg;
            }

            const caption = `🌑 ───『 *مـرحـبـاً بـك فـي الـظـلام* 』─── 🌑\n\n` +
                            `👤 *العضو:* @${user.split('@').at(0)}\n` +
                            `🏰 *المجموعة:* ${meta.subject}\n` +
                            `👥 *العدد الآن:* ${meta.participants.length}\n\n` +
                            `🕯️ *أهلاً بك بيننا.*`;

            try {
                await sock.sendMessage(groupId, { image: { url: ppUrl }, caption, mentions: [user] });
            } catch {
                await sock.sendMessage(groupId, { text: caption, mentions: [user] });
            }
        }
    }
};
              
