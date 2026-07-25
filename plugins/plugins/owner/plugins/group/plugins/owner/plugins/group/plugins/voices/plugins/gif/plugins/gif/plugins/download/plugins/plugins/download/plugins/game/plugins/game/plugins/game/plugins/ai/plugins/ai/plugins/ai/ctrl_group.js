let control = async (m, { command, text, conn, bot, participants }) => {
    try {
        const isBotOwner = (userId) => {
            if (!bot.config || !bot.config.owners) return false;
            return bot.config.owners.some(owner => 
                owner.jid === userId || owner.lid === userId
            );
        };

        const getUser = () => {
            if (m.quoted) return m.quoted.sender;
            if (m.mentionedJid && m.mentionedJid.length > 0) return m.mentionedJid[0];
            if (text) return text + "@s.whatsapp.net";
            return null;
        };

        if (command === "ضيف") {
            if (!text) return m.reply("❌ فين الرقم؟");
            if (m.quoted) {
                await conn.groupParticipantsUpdate(m.chat, [m.quoted.sender], 'add');
                return m.reply("*✅ تمت الإضافة*");
            }
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                await conn.groupParticipantsUpdate(m.chat, [m.mentionedJid[0]], 'add');
                return m.reply("*✅ تمت الإضافة*");
            }
            await conn.groupParticipantsUpdate(m.chat, [text + "@s.whatsapp.net"], 'add');
            return m.reply("*✅ تمت الإضافة*");
        }
        
        if (command === "طرد") {
            let user = getUser();
            if (!user) return m.reply("❌ منشن أو رد على العضو");
            
            if (isBotOwner(user) || user === conn.user.id) {
                m.reply("بتهزر ؟");
                return await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
            }
            
            await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
            return m.reply("✅ تم الطرد");
        }
        
        if (command === "رفع") {
            let user = getUser();
            if (!user) return m.reply("❌ منشن أو رد على العضو");
            await conn.groupParticipantsUpdate(m.chat, [user], 'promote');
            return m.reply("✅ تم الرفع");
        }
        
        if (command === "خفض") {
            let user = getUser();
            if (!user) return m.reply("❌ منشن أو رد على العضو");
            await conn.groupParticipantsUpdate(m.chat, [user], 'demote');
            return m.reply("✅ تم الخفض");
        }
        
    } catch (error) {
        await m.reply("❌ " + error.message);
    }
};

control.usage = ['ضيف', 'طرد', 'رفع', 'خفض'];
control.command =j
 ['ضيف', 'طرد', 'رفع', 'خفض'];
control.admin = true;
control.botAdmin = true;
control.category = "admin";
export default control;
Control .js
