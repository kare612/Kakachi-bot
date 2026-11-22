module.exports = {
    name: 'welcome',
    aliases: ['الترحيب', 'ترحيب'],
    async execute(sock, m, args, remoteJid) {
        if (!remoteJid.endsWith('@g.us')) {
            return sock.sendMessage(remoteJid, { text: '❌ للمجموعات فقط.' }, { quoted: m });
        }

        // إذا قمت بمنشن عضو مع الأمر (.welcome @فلان) يرحب به بصورته فوراً
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentioned && mentioned.length > 0) {
            return await this.onJoin(sock, remoteJid, mentioned);
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
            return sock.sendMessage(remoteJid, { text: '🌑 *الترحيب التلقائي مفعّل!* (يمكنك تجربته فوراً عبر `.welcome @العضو` أو إيقافه بـ `.welcome ايقاف`)' }, { quoted: m });
        }
    },

    async onJoin(sock, groupId, participants) {
        if (global.welcomeDisabled?.[groupId]) return;

        let groupName = 'المجموعة';
        let memberCount = '';
        try {
            const meta = await sock.groupMetadata(groupId);
            groupName = meta.subject;
            memberCount = `\n👥 *العدد الآن:* ${meta.participants.length}`;
        } catch {}

        const fallbackImg = 'https://ibb.co';

        for (const p of participants) {
            const user = typeof p === 'string' ? p : (p?.id || p?.jid || p?.lid);
            if (!user) continue;

            let ppUrl;
            try {
                ppUrl = await sock.profilePictureUrl(user, 'image');
            } catch {
                ppUrl = fallbackImg;
            }

            const caption = `🌑 ───『 *مـرحـبـاً بـك فـي الـظـلام* 』─── 🌑\n\n` +
                            `👤 *العضو:* @${user.split('@').at(0)}\n` +
                            `🏰 *المجموعة:* ${groupName}${memberCount}\n\n` +
                            `🕯️ *أهلاً بك بيننا.*`;

            try {
                const res = await fetch(ppUrl);
                if (!res.ok) throw new Error('HTTP');
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
