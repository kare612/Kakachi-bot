// ملف تطوير وإدارة أرقام الألعاب واللوحات الإحصائية لبوت كاكاشي

module.exports = {
    name: 'أرقام',
    alias: ['ارقام_الالعاب', 'لفل', 'فلوسي', 'ترتيب'],
    category: 'games_database',
    desc: 'نظام إدارة وتطوير أرقام وإحصائيات ألعاب النقابات والأعضاء',
    async execute(client, m, { args, isOwner }) {
        const cmd = args ? args.toLowerCase() : '';
        const userId = m.sender;

        // 1. التأكد من هيكلة أرقام الألعاب لكل مستخدم في قاعدة البيانات
        if (!global.db) global.db = {};
        if (!global.db.users) global.db.users = {};
        if (!global.db.guilds) global.db.guilds = {};

        if (!global.db.users[userId]) {
            global.db.users[userId] = {
                money: 1000,     // أموال البداية الوهمية
                xp: 0,          // نقاط الخبرة
                level: 1,       // مستوى اللاعب
                gamesWon: 0,    // عدد الألعاب الفائز بها
                joinedChannel: false
            };
        }

        const user = global.db.users[userId];

        // ==================== [الأمر الرئيسي: عرض الملف الشخصي والأرقام] ====================
        if (!cmd) {
            // كود حساب نقاط الخبرة اللازمة للصعود للمستوى التالي
            const requiredXp = user.level * 500;
            
            const profileText = `🎮 *ملف أرقام الألعاب الخاص بك* 🎮\n\n` +
                                `👤 *اللاعب:* @${userId.split('@')}\n` +
                                `⭐ *المستوى الحالي:* [ ${user.level} ]\n` +
                                `⚡ *نقاط الخبرة (XP):* ${user.xp} / ${requiredXp}\n` +
                                `💰 *رصيد الأموال الوهمية:* $${user.money}\n` +
                                `🏆 *الألعاب الفائز بها:* ${user.gamesWon} فوز\n\n` +
                                `📈 *أوامر التطوير والترتيب المتوفرة:*\n` +
                                `• *.أرقام ترتيب* — عرض توب 5 لأغنى وأقوى اللاعبين بالبوت.\n` +
                                `• *.أرقام هدايا* — استلام الهدية اليومية للألعاب ($500).\n` +
                                `• *.أرقام إضافة [@منشن] [العدد]* — (للمطور فقط) لتعديل أرقام الميديا والألعاب.`;
            
            return await client.sendMessage(m.chat, { text: profileText, mentions: [userId] }, { quoted: m });
        }

        // ==================== 1️⃣ أمر استلام الهدية اليومية لرفع الأرقام ====================
        if (cmd === 'هدايا' || cmd === 'هدية') {
            const dailyReward = 500;
            user.money += dailyReward;
            user.xp += 150;

            // تحديث تلقائي للمستوى بناءً على أرقام الـ XP
            if (user.xp >= user.level * 500) {
                user.level += 1;
                user.xp = 0; // تصفير العداد للمستوى الجديد
                await client.sendMessage(m.chat, { text: `🎉 كفووو! ارتفعت أرقامك ووصلت للمستوى [ ${user.level} ] بنجاح! ⭐` }, { quoted: m });
            }

            return await client.sendMessage(m.chat, { 
                text: `💰 تم إضافة *$${dailyReward}* و *150 XP* لأرقام ألعابك بنجاح للعب بها في النقابات!` 
            }, { quoted: m });
        }

        // ==================== 2️⃣ أمر لوحة الصدارة وترتيب الأرقام بالسيرفر ====================
        if (cmd === 'ترتيب' || cmd === 'توب') {
            const sortedUsers = Object.entries(global.db.users)
                .sort((a, b) => b[1].money - a[1].money) // الترتيب حسب الأعلى أموالاً
                .slice(0, 5); // توب 5 لاعبين

            let leaderboardText = `🏆 *قائمة توب أساطير الألعاب في البوت* 🏆\n\n`;
            const mentions = [];

            sortedUsers.forEach((u, index) => {
                const uId = u[0];
                const uData = u[1];
                mentions.push(uId);
                leaderboardText += `${index + 1}# 👑 @${uId.split('@')} | مستوى: [${uData.level}] | ثروة: $${uData.money}\n`;
            });

            return await client.sendMessage(m.chat, { text: leaderboardText, mentions: mentions }, { quoted: m });
        }

        // ==================== 3️⃣ أمر التحكم البرمجي للمطور (تعديل وزيادة أرقام الأعضاء) ====================
        if (cmd === 'إضافة' || cmd === 'اضافه') {
            if (!isOwner) return await client.sendMessage(m.chat, { text: '❌ هذا الأمر مخصص لمطور البوت فقط لتعديل الأرقام!' }, { quoted: m });

            let target = m.mentionedJid && m.mentionedJid ? m.mentionedJid : '';
            if (!target) return await client.sendMessage(m.chat, { text: '⚠️ قم بعمل منشن للاعب المراد تعديل أرقامه.' }, { quoted: m });

            const amount = parseInt(args[2]);
            if (isNaN(amount)) return await client.sendMessage(m.chat, { text: '⚠️ يرجى تحديد كمية رقمية صحيحة لإضافتها.' }, { quoted: m });

            if (!global.db.users[target]) {
                global.db.users[target] = { money: 1000, xp: 0, level: 1, gamesWon: 0, joinedChannel: false };
            }

            global.db.users[target].money += amount;
            return await client.sendMessage(m.chat, { 
                text: `⚙️ [إدارة المطور]: تم شحن أرقام ألعاب العضو بنجاح بمبلغ: $${amount}`,
                mentions: [target]
            }, { quoted: m });
        }
    }
};
