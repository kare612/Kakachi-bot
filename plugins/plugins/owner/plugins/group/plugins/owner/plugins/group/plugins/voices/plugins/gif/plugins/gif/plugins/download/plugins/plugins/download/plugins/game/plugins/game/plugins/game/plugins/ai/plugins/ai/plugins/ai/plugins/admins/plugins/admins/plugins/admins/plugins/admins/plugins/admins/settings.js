async function handler(m, { conn, command, args }) {
    const chatId = m.chat;
    const subCmd = args[0]?.toLowerCase();
    const menu = `
╭─┈─┈─┈─⟞🕸️⟝─┈─┈─┈─╮
│ *نظام التفعيل والتشغيل*
│
│ *.تفعيل ايقاف_الترحيب*
│ > البوت هيبطل يرحب بالاعضاء
│
│ *.تفعيل تشغيل_الترحيب*
│ > البوت يرحب بالاعضاء
│
│ *.تفعيل تشغيل_الادمن*
│ > البوت يرد على المشرفين فقط
│
│ *.تفعيل ايقاف_الادمن*
│ > البوت يرد على الجميع
│
│ *.تفعيل مطور_فقط*
│ > البوت يتفاعل مع المطورين فقط
│
│ *.تفعيل مطور_عام*
│ > البوت يتفاعل مع الجميع
│
│ *.تفعيل تشغيل_مضاد_الروابط*
│ > البوت يحذف أي رابط
│
│ *.تفعيل ايقاف_مضاد_الروابط*
│ > البوت مايحذفش الروابط
│
│ *.تفعيل ايقاف_خاص*
│ > البوت هيشتغل مع المطورين فقط خاص
│
│ *.تفعيل تشغيل_خاص*
│ > البوت هيشتغل مع كله خاص
╰─┈─┈─┈─⟞🕸️⟝─┈─┈─┈─╯
`;
    if (!subCmd) {
        await conn.sendButton(m.chat, {
            bodyText:  menu,
            footerText: "𝐕𝐈𝐈7 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🕷️",
            buttons: [
    { name: "quick_reply", params: { display_text: "🪐 ايقاف التنصيب (البوتات الفرعي)", id: ".تفعيل ايقاف_الفرعي" } },
    { name: "quick_reply", params: { display_text: "🚀 تشغيل التنصيب", id: ".تفعيل تشغيل_الفرعي" } },
    { name: "quick_reply", params: { display_text: "🔇 ايقاف الترحيب", id: ".تفعيل ايقاف_الترحيب" } },
    { name: "quick_reply", params: { display_text: "🔊 تشغيل الترحيب", id: ".تفعيل تشغيل_الترحيب" } },
    { name: "quick_reply", params: { display_text: "👑 تشغيل الادمن", id: ".تفعيل تشغيل_الادمن" } },
    { name: "quick_reply", params: { display_text: "👥 ايقاف الادمن", id: ".تفعيل ايقاف_الادمن" } },
    { name: "quick_reply", params: { display_text: "⭐ مطور فقط", id: ".تفعيل مطور_فقط" } },
    { name: "quick_reply", params: { display_text: "🌍 مطور عام", id: ".تفعيل مطور_عام" } },
    { name: "quick_reply", params: { display_text: "🚫 تشغيل مضاد الروابط", id: ".تفعيل تشغيل_مضاد_الروابط" } },
    { name: "quick_reply", params: { display_text: "✅ ايقاف مضاد الروابط", id: ".تفعيل ايقاف_مضاد_الروابط" } },
    { name: "quick_reply", params: { display_text: "🌟 تشغيل خاص لـ المطورين فقط", id: ".تفعيل ايقاف_خاص" } },
    { name: "quick_reply", params: { display_text: "💔 ايقاف التشغيل خاص لـ المطورين فقط", id: ".تفعيل تشغيل_خاص" } }
],
          mentions: [m.sender],
  newsletter: {
      name: '𝐕𝐈𝐈7 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🕷️',
      jid: '120363225356834044@newsletter'
    },
  interactiveConfig: {
    buttons_limits: 1, // لازم تبقي واحد
    list_title: "Available Options",
    button_title: "Click Here",
    canonical_url: "https://example.com"
  }
        }, m);
        return;
    }

    let result;
    
    switch (subCmd) {
    case 'ايقاف_الفرعي':
            if (!m.isOwner) {
                result = '*❌ الأمر ده بس لـ المطور*';
                break;
            }
            global.db.noSub = true;
            result = '*✅ تم ايقاف تنصيب البوتات الفرعيه*\n> ماحدش هيعرف يستخدم امر تنصيب تاني';
            break;
            
        case 'تشغيل_الفرعي':
            if (!m.isOwner) {
                result = '*❌ الأمر ده بس لـ المطور*';
                break;
            }
            global.db.noSub = false;
            result = '*✅ تم تشغيل تنصيب البوتات الفرعيه*\n> دلوقتي الكل يقدر يستخدم البوتات الفرعيه';
            break;
        case 'ايقاف_الترحيب':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].noWelcome = true;
            result = '*✅ تم تفعيل وضع عدم الترحيب*\n> البوت هيبطل يرحب بالاعضاء';
            break;
            
        case 'تشغيل_الترحيب':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].noWelcome = false;
            result = '*✅ تم تفعيل وضع الترحيب*\n> البوت يرحب بالاعضاء';
            break;
            
        case 'تشغيل_الادمن':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].adminOnly = true;
            result = '*✅ تم تفعيل وضع الادمن*\n> البوت سيتفاعل مع المشرفين فقط';
            break;
            
        case 'ايقاف_الادمن':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].adminOnly = false;
            result = '*✅ تم فك وضع الادمن*\n> البوت سيتفاعل مع جميع الأعضاء';
            break;
            
        case 'مطور_فقط':
            if (!m.isOwner) {
                result = '*❌ هذا الأمر للمطور فقط*';
                break;
            }
            global.db.ownerOnly = true;
            result = '*✅ تم تفعيل وضع المطور فقط*\n> البوت سيتفاعل مع المطورين فقط';
            break;
            
        case 'مطور_عام':
            if (!m.isOwner) {
                result = '*❌ هذا الأمر للمطور فقط*';
                break;
            }
            global.db.ownerOnly = false;
            result = '*✅ تم تفعيل وضع المطور العام*\n> البوت سيتفاعل مع الجميع';
            break;
            
        case 'تشغيل_مضاد_الروابط':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].antiLink = true;
            result = '*✅ تم تفعيل مضاد الروابط*\n> البوت هيحذف أي رابط';
            break;
            
        case 'ايقاف_مضاد_الروابط':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].antiLink = false;
            result = '*✅ تم ايقاف مضاد الروابط*\n> البوت مايحذفش الروابط';
            break;
            case 'ايقاف_خاص':
            if (!m.isOwner) {
                result = '*❌ هذا الأمر للمطورين فقط*';
                break;
            }
            global.db.dev = true;
            result = '*✅ تم ايقاف الخاص للمستخدمين*\n> فقط المطورين يقدروا يستحدموه خاص';
            break;
            case 'تشغيل_خاص':
            if (!m.isOwner) {
                result = '*❌ هذا الأمر للمطورين فقط*';
                break;
            }
            global.db.dev = false;
            result = '*✅ تم تشغيل البوت خاص ل الكل*\n> كله دلوقت يقدر يستخدم البوت خاص';
            break;
        default:
            return m.reply("╭─┈─┈─┈─⟞🕸️⟝─┈─┈─┈─╮\n│ *نظام التفعيل والتشغيل*\n│\n│ 🔇 ايقاف_الترحيب\n│ 🔊 تشغيل_الترحيب\n│ 👑 تشغيل_الادمن\n│ 👥 ايقاف_الادمن\n│ ⭐ مطور_فقط\n│ 🌍 مطور_عام\n│ 🚫 تشغيل_مضاد_الروابط\n│ ✅ ايقاف_مضاد_الروابط\n╰─┈─┈─┈─⟞🕸️⟝─┈─┈─┈─╯");
    }
    
    if (result) {
        m.reply(result);
    }
};

handler.usage = ['تفعيل'];
handler.category = 'admin';
handler.command = ['تفعيل'];

export default handler;
