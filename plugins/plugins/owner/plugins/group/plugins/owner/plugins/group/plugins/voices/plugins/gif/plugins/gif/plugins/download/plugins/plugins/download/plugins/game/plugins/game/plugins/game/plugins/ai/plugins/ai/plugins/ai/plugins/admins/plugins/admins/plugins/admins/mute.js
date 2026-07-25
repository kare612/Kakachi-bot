const isOwner = (userId, bot) => bot.config?.owners?.some(o => o.jid === userId || o.lid === userId);

const handler = async (m, { conn, command, bot }) => {
    let target = m.mentionedJid?.[0];
    
    if (target && typeof m.lid2jid === 'function') {
        target = await m.lid2jid(target);
    }
    
    if (!target && m.quoted) {
        if (typeof m.lid2jid === 'function') {
            target = await m.lid2jid(m.quoted.sender);
        } else {
            target = m.quoted.sender;
        }
    }
    
    if (!target) return m.reply(`*🔇 كتم/فك_كتم @user*\nاو رد على رسالته`);
    if (typeof target !== 'string') return m.reply(`*❌ حدث خطأ في تحديد المستخدم*`);
    if (isOwner(target, bot)) return m.reply(`*❌ لا يمكن كتم المطور*`);
    
    const group = global.db.groups[m.chat] ||= {};
    const muteList = group.mute ||= [];
    
    let isMuted = false;
    for (let i = 0; i < muteList.length; i++) {
        if (muteList[i] === target) {
            isMuted = true;
            break;
        }
    }
    
    if (command === "كتم") {
        if (isMuted) {
            await conn.sendMessage(m.chat, { text: `*❌ @${target.split('@')[0]} مكتوم*`, mentions: [target] });
            return;
        }
        muteList.push(target);
        await conn.sendMessage(m.chat, { text: `*✅ تم كتم @${target.split('@')[0]}*\n🔒 لن يتمكن من الكلام`, mentions: [target] });
    } else if (command === "فك_كتم") {
        if (!isMuted) {
            await conn.sendMessage(m.chat, { text: `*❌ @${target.split('@')[0]} ليس مكتوماً*`, mentions: [target] });
            return;
        }
        let newList = [];
        for (let i = 0; i < muteList.length; i++) {
            if (muteList[i] !== target) {
                newList.push(muteList[i]);
            }
        }
        group.mute = newList;
        await conn.sendMessage(m.chat, { text: `*✅ تم فك كتم @${target.split('@')[0]}*\n🔓 يمكنه الكلام الآن`, mentions: [target] });
    }
};

handler.before = async (m, { conn, bot }) => {
    if (!m.isGroup) return;
    if (m.isOwner || m.isAdmin || isOwner(m.sender, bot)) return;
    
    const muteList = global.db?.groups[m.chat]?.mute;
    if (!muteList) return;
    if (muteList.length === 0) return;
    
    let isMuted = false;
    for (let i = 0; i < muteList.length; i++) {
        if (muteList[i] === m.sender) {
            isMuted = true;
            break;
        }
    }
    
    if (isMuted) {
        await conn.sendMessage(m.chat, { delete: m.key });
        return true;
    }
};

handler.command = ["كتم", "فك_كتم"];
handler.admin = true;

export default handler;
