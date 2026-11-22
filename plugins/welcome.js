module.exports = {
    name: 'welcome',
    aliases: ['الترحيب', 'ترحيب'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) {
            return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });
        }

        global.welcomeDisabled = global.welcomeDisabled || {};
        const option = args.at(0)?.toLowerCase();

        if (option === 'off' || option === 'ايقاف') {
            global.welcomeDisabled[remoteJid] = true;
            return sock.sendMessage(remoteJid, { text: '🕯️ *تم إيقاف الترحيب التلقائي في هذه المجموعة.*' }, { quoted: m });
        } else if (option === 'on' || option === 'تفعيل') {
            global.welcomeDisabled[remoteJid] = false;
            return sock.sendMessage(remoteJid, { text: '🌑 *الترحيب التلقائي بصورة الملف الشخصي مفعّل الآن.*' }, { quoted: m });
        } else {
            return sock.sendMessage(remoteJid, { text: '🌑 *الترحيب التلقائي مفعّل افتراضياً!* لإيقافه اكتب `.welcome ايقاف`' }, { quoted: m });
        }
    },

    async onJoin(sock, groupId, participants) {
        if (global.welcomeDisabled?.[groupId]) return;

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
                            `👤 *العضو الجديد:* @${user.split('@').at(0)}\n` +
                            `🏰 *المجموعة:* ${meta.subject}\n` +
                            `👥 *العدد الآن:* ${meta.participants.length}\n\n` +
                            `🕯️ *أهلاً بك بيننا.*`;

            try {
                // تحميل صورة البروفايل كـ Buffer لضمان ظهورها دائماً في واتساب
                const res = await fetch(ppUrl);
                if (!res.ok) throw new Error('فشل تحميل الصورة');
                const imgBuffer = Buffer.from(await res.arrayBuffer());

                await sock.sendMessage(groupId, {
                    image: imgBuffer,
                    caption,
                    mentions: [user]
                });
            } catch {
                await sock.sendMessage(groupId, { text: caption, mentions: [user] });
            }
        }
    }
};
