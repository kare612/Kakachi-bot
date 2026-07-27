// كود نظام النقابات مع قفل الاشتراك الإجباري لقناة الواتساب الخاصة بك
const CHANNEL_LINK = "https://whatsapp.com"; 

module.exports = {
    name: 'نقابة',
    alias: ['نقابات', 'العصابات', 'انضمام'],
    category: 'guilds',
    desc: 'نظام إدارة النقابات والتحكم بالاشتراك الإجباري في القناة',
    async execute(client, m, { text, args, participants, isOwner }) {
        const cmd = args ? args.toLowerCase() : '';

        // تهيئة قاعدة بيانات البوت للحفظ تلقائياً
        if (!global.db) global.db = {};
        if (!global.db.guilds) global.db.guilds = {};
        if (!global.db.users) global.db.users = {};

        const userId = m.sender;
        
        // التحقق من حالة اشتراك المستخدم في قاعدة البيانات
        if (!global.db.users[userId]) {
            global.db.users[userId] = { joinedChannel: false };
        }

        // ==================== أمر تأكيد الاشتراك للمستخدمين ====================
        if (cmd === 'تأكيد' || cmd === 'تاكيد') {
            global.db.users[userId].joinedChannel = true;
            return await client.sendMessage(m.chat, { 
                text: '✅ شكرًا لانضمامك لقناتنا! تم تفعيل ميزات الألعاب والنقابات لك الآن بنجاح. أعد كتابة الأمر البرمجي من جديد.' 
            }, { quoted: m });
        }

        // 🛡️ [جدار الحماية] يمنع غير المشتركين من تشغيل أوامر النقابة والألعاب
        if (!global.db.users[userId].joinedChannel && !isOwner) {
            const verificationText = `📢 *عذرًا، هذا الأمر مقفل برابط القناة!* 📢\n\n` +
                                     `⚠️ لاستخدام نظام النقابات والألعاب في بوت كاكاشي، يجب عليك أولاً متابعة قناة المطور الرسمية على الواتساب:\n\n` +
                                     `🔗 *رابط القناة:* ${CHANNEL_LINK}\n\n` +
                                     `👉 بعد الانضمام والمتابعة، أرسل الأمر التالي لتفعيل البوت:\n` +
                                     `*.نقابة تأكيد*`;
            return await client.sendMessage(m.chat, { text: verificationText }, { quoted: m });
        }

        // ==================== قائمة أوامر النقابات الرئيسية ====================
        if (!cmd) {
            const menu = `🛡️ *نظام التحكم في النقابات والعصابات* 🛡️\n\n` +
                         `⚔️ *الأوامر المتاحة:* \n` +
                         `1️⃣ *.نقابة إنشاء [اسم النقابة]* — تأسيس نقابة جديدة.\n` +
                         `2️⃣ *.نقابة انضمام [اسم النقابة]* — الانضمام لنقابة موجودة.\n` +
                         `3️⃣ *.نقابة طرد [@منشن]* — طرد عضو (للقائد فقط).\n` +
                         `4️⃣ *.نقابة قائمتي* — عرض أعضاء وترتيب نقابتك.\n` +
                         `5️⃣ *.نقابة حذف* — إغلاق وحذف النقابة نهائياً.\n\n` +
                         `📢 *قناتك الحالية في البوت:* \n${CHANNEL_LINK}`;
            return await client.sendMessage(m.chat, { text: menu }, { quoted: m });
        }

        // ==================== أمر إنشاء نقابة ====================
        if (cmd === 'إنشاء' || cmd === 'انشاء') {
            const guildName = args.slice(1).join(' ');
            if (!guildName) return await client.sendMessage(m.chat, { text: '⚠️ يرجى كتابة اسم النقابة! مثال: `.نقابة إنشاء الأساطير`' }, { quoted: m });

            for (let name in global.db.guilds) {
                if (global.db.guilds[name].owner === m.sender) {
                    return await client.sendMessage(m.chat, { text: `❌ أنت قائد لنقابة [*${name}*] بالفعل!` }, { quoted: m });
                }
            }

            if (global.db.guilds[guildName]) return await client.sendMessage(m.chat, { text: '❌ اسم هذه النقابة مأخوذ بالفعل.' }, { quoted: m });

            global.db.guilds[guildName] = {
                owner: m.sender,
                members: [m.sender],
                level: 1,
                points: 0
            };

            return await client.sendMessage(m.chat, { text: `🎉 تم تأسيس نقابة [*${guildName}*] بنجاح ومربوطة بقناتك!` }, { quoted: m });
        }

        // ==================== أمر الانضمام لنقابة ====================
        if (cmd === 'انضمام') {
            const guildName = args.slice(1).join(' ');
            if (!guildName || !global.db.guilds[guildName]) {
                return await client.sendMessage(m.chat, { text: '❌ هذه النقابة غير موجودة بالسيرفر!' }, { quoted: m });
            }

            for (let name in global.db.guilds) {
                if (global.db.guilds[name].members.includes(m.sender)) {
                    return await client.sendMessage(m.chat, { text: '❌ أنت عضو في نقابة أخرى بالفعل! غادرها أولاً.' }, { quoted: m });
                }
            }

            global.db.guilds[guildName].members.push(m.sender);
            return await client.sendMessage(m.chat, { text: `⚔️ تم انضمامك بنجاح إلى نقابة [*${guildName}*]!` }, { quoted: m });
        }

        // ==================== أمر طرد عضو ====================
        if (cmd === 'طرد') {
            let target = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : '';
            if (!target) return await client.sendMessage(m.chat, { text: '⚠️ قم بعمل منشن للعضو الذي تريد طرده.' }, { quoted: m });

            let userGuild = null;
            for (let name in global.db.guilds) {
                if (global.db.guilds[name].owner === m.sender) userGuild = name;
            }

            if (!userGuild) return await client.sendMessage(m.chat, { text: '❌ أنت لست قائد نقابة!' }, { quoted: m });

            const index = global.db.guilds[userGuild].members.indexOf(target);
            if (index === -1) return await client.sendMessage(m.chat, { text: '❌ هذا العضو ليس موجوداً في نقابتك.' }, { quoted: m });

            global.db.guilds[userGuild].members.splice(index, 1);
            return await client.sendMessage(m.chat, { text: `👞 تم طرد العضو بنجاح من نقابة [*${userGuild}*].`, mentions: [target] }, { quoted: m });
        }

        // ==================== أمر عرض قائمة النقابة ====================
        if (cmd === 'قائمتي') {
            let userGuild = null;
            for (let name in global.db.guilds) {
                if (global.db.guilds[name].members.includes(m.sender)) userGuild = name;
            }

            if (!userGuild) return await client.sendMessage(m.chat, { text: '⚠️ أنت غير منضم لأي نقابة حالياً.' }, { quoted: m });

            const gData = global.db.guilds[userGuild];
            let membersText = gData.members.map((m, i) => `${i + 1}. @${m.split('@')[0]}`).join('\n');

            const infoText = `📊 *تفاصيل نقابة [ ${userGuild} ]* 📊\n\n` +
                             `👑 *القائد:* @${gData.owner.split('@')[0]}\n` +
                             `⭐ *المستوى:* ${gData.level}\n` +
                             `🏆 *النقاط:* ${gData.points}\n\n` +
                             `👥 *الأعضاء الملتزمين:* \n${membersText}`;

            return await client.sendMessage(m.chat, { text: infoText, mentions: gData.members }, { quoted: m });
        }

        // ==================== أمر حذف النقابة ====================
        if (cmd === 'حذف') {
            let userGuild = null;
            for (let name in global.db.guilds) {
                if (global.db.guilds[name].owner === m.sender) userGuild = name;
            }

            if (!userGuild) return await client.sendMessage(m.chat, { text: '❌ الحذف متاح فقط لقائد النقابة!' }, { quoted: m });

            delete global.db.guilds[userGuild];
            return await client.sendMessage(m.chat, { text: `💥 تم حذف نقابة [*${userGuild}*] وحذف بياناتها نهائياً.` }, { quoted: m });
        }
    }
};
                
