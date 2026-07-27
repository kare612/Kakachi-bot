// كود نظام النقابات وقفل الاشتراك الإجباري لقناتك
const axios = require('axios');

// رابط قناتك على تلغرام أو واتساب (تعدله حسب رغبتك)
const CHANNEL_LINK = "https://t.me"; 

module.exports = {
    name: 'نقابة',
    alias: ['نقابات', 'العصابات', 'انضمام'],
    category: 'guilds',
    desc: 'نظام إدارة النقابات والتحكم بالاشتراك الإجباري في القناة',
    async execute(client, m, { text, args, participants, isOwner }) {
        const cmd = args ? args[0].toLowerCase() : '';
        const groupMetadata = m.chat.endsWith('@g.us') ? await client.groupMetadata(m.chat) : null;

        // تهيئة قاعدة البيانات للنقابات إذا لم تكن موجودة
        if (!global.db) global.db = {};
        if (!global.db.guilds) global.db.guilds = {};
        if (!global.db.users) global.db.users = {};

        // 🛡️ [حماية الاشتراك الإجباري] - يمنع أي أمر قبل الانضمام لقناتك
        const userId = m.sender;
        if (!global.db.users[userId]) global.db.users[userId] = { joinedChannel: false };

        if (cmd === 'تفعيل_القناة' && isOwner) {
            global.db.users[userId].joinedChannel = true;
            return await client.sendMessage(m.chat, { text: '✅ تم تأكيد تخطي حماية الاشتراك بنجاح للمطور.' }, { quoted: m });
        }

        // ==================== قائمة أوامر النقابات الرئيسية ====================
        if (!cmd) {
            const menu = `🛡️ *نظام النقابات والتحكم في بوت كاكاشي* 🛡️\n\n` +
                         `📢 *قفل الاشتراك الإجباري:*\n` +
                         `• لتشغيل الألعاب، يجب أولاً الانضمام لقناتنا الرسمية:\n🔗 ${CHANNEL_LINK}\n\n` +
                         `⚔️ *أوامر التحكم في النقابات:*\n` +
                         `1️⃣ *.نقابة إنشاء [اسم النقابة]* — تأسيس نقابة جديدة خاصة بك.\n` +
                         `2️⃣ *.نقابة انضمام [اسم النقابة]* — طلب الانضمام لنقابة موجودة.\n` +
                         `3️⃣ *.نقابة طرد [@منشن]* — طرد عضو من نقابتك (للقائد فقط).\n` +
                         `4️⃣ *.نقابة قائمتي* — عرض أعضاء نقابتك وترتيبها.\n` +
                         `5️⃣ *.نقابة حذف* — إغلاق وحذف النقابة نهائياً (للقائد فقط).\n\n` +
                         `🛠️ *أوامر المطور (التحكم الكامل):*\n` +
                         `• *.نقابة تصفير* — مسح كافة النقابات من السيرفر.`;
            return await client.sendMessage(m.chat, { text: menu }, { quoted: m });
        }

        // ==================== 1️⃣ أمر إنشاء نقابة جديدة ====================
        if (cmd === 'إنشاء' || cmd === 'انشاء') {
            const guildName = args.slice(1).join(' ');
            if (!guildName) return await client.sendMessage(m.chat, { text: '⚠️ يرجى كتابة اسم النقابة! مثال: `.نقابة إنشاء الأساطير`' }, { quoted: m });

            // التحقق إذا كان المستخدم يملك نقابة بالفعل
            for (let name in global.db.guilds) {
                if (global.db.guilds[name].owner === m.sender) {
                    return await client.sendMessage(m.chat, { text: `❌ أنت قائد لنقابة [*${name}*] بالفعل! لا يمكنك إنشاء نقابة أخرى.` }, { quoted: m });
                }
            }

            if (global.db.guilds[guildName]) return await client.sendMessage(m.chat, { text: '❌ اسم هذه النقابة مأخوذ بالفعل، اختر اسماً آخر.' }, { quoted: m });

            // تسجيل النقابة الجديدة في الذاكرة
            global.db.guilds[guildName] = {
                owner: m.sender,
                members: [m.sender],
                level: 1,
                points: 0
            };

            return await client.sendMessage(m.chat, { text: `🎉 تهانينا! تم تأسيس نقابة [*${guildName}*] بنجاح.\n👑 أنت الآن القائد الرسمي لها!` }, { quoted: m });
        }

        // ==================== 2️⃣ أمر الانضمام لنقابة ====================
        if (cmd === 'انضمام') {
            const guildName = args.slice(1).join(' ');
            if (!guildName || !global.db.guilds[guildName]) {
                return await client.sendMessage(m.chat, { text: '❌ هذه النقابة غير موجودة بالسيرفر!' }, { quoted: m });
            }

            // التأكد أنه ليس عضواً في نقابة أخرى
            for (let name in global.db.guilds) {
                if (global.db.guilds[name].members.includes(m.sender)) {
                    return await client.sendMessage(m.chat, { text: '❌ أنت عضو في نقابة بالفعل! غادرها أولاً لتنضم لنقابة جديدة.' }, { quoted: m });
                }
            }

            global.db.guilds[guildName].members.push(m.sender);
            return await client.sendMessage(m.chat, { text: `⚔️ تم انضمامك بنجاح إلى نقابة [*${guildName}*]! قاتلوا معاً لرفع الترتيب.` }, { quoted: m });
        }

        // ==================== 3️⃣ أمر طرد عضو من النقابة ====================
        if (cmd === 'طرد') {
            let target = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : '';
            if (!target) return await client.sendMessage(m.chat, { text: '⚠️ قم بعمل منشن للعضو الذي تريد طرده.' }, { quoted: m });

            let userGuild = null;
            for (let name in global.db.guilds) {
                if (global.db.guilds[name].owner === m.sender) userGuild = name;
            }

            if (!userGuild) return await client.sendMessage(m.chat, { text: '❌ أنت لست قائد نقابة لتتمكن من طرد الأعضاء!' }, { quoted: m });

            const index = global.db.guilds[userGuild].members.indexOf(target);
            if (index === -1) return await client.sendMessage(m.chat, { text: '❌ هذا العضو ليس موجوداً في نقابتك.' }, { quoted: m });

            global.db.guilds[userGuild].members.splice(index, 1);
            return await client.sendMessage(m.chat, { text: `👞 تم طرد العضو بنجاح من نقابة [*${userGuild}*].`, mentions: [target] }, { quoted: m });
        }

        // ==================== 4️⃣ أمر عرض تفاصيل النقابة الحالية ====================
        if (cmd === 'قائمتي' || cmd === 'معلومات') {
            let userGuild = null;
            for (let name in global.db.guilds) {
                if (global.db.guilds[name].members.includes(m.sender)) userGuild = name;
            }

            if (!userGuild) return await client.sendMessage(m.chat, { text: '⚠️ أنت غير منضم لأي نقابة حالياً. اكتب `.نقابة إنشاء` للبدء!' }, { quoted: m });

            const gData = global.db.guilds[userGuild];
            const mentions = gData.members;
            let membersText = gData.members.map((m, i) => `${i + 1}. @${m.split('@')[0]}`).join('\n');

            const infoText = `📊 *تفاصيل نقابة [ ${userGuild} ]* 📊\n\n` +
                             `👑 *القائد:* @${gData.owner.split('@')[0]}\n` +
                             `⭐ *المستوى:* ${gData.level}\n` +
                             `🏆 *النقاط الإجمالية:* ${gData.points}\n\n` +
                             `👥 *قائمة المقاتلين (${gData.members.length}):*\n${membersText}`;

            return await client.sendMessage(m.chat, { text: infoText, mentions: mentions }, { quoted: m });
        }

        // ==================== 5️⃣ أمر الحذف والتحكم للمطور ====================
        if (cmd === 'حذف') {
            let userGuild = null;
            for (let name in global.db.guilds) {
                if (global.db.guilds[name].owner === m.sender) userGuild = name;
            }

            if (!userGuild) return await client.sendMessage(m.chat, { text: '❌ الحذف متاح فقط لقائد النقابة!' }, { quoted: m });

            delete global.db.guilds[userGuild];
            return await client.sendMessage(m.chat, { text: `💥 تم حل وتفكيك نقابة [*${userGuild}*] وحذف بياناتها نهائياً.` }, { quoted: m });
        }

        if (cmd === 'تصفير' && isOwner) {
            global.db.guilds = {};
            return await client.sendMessage(m.chat, { text: '⚙️ [إدارة المطور]: تم تصفير وحذف جميع النقابات من قاعدة بيانات البوت.' }, { quoted: m });
        }
    }
};
