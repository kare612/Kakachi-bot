import fs from 'fs';

export default {
  name: 'الاوامر',
  alias: ['أوامر', 'اوامر', 'قائمة', 'menu', 'help'],
  category: 'main',
  desc: 'عرض اللوحة البرمجية وكافة الأوامر المضافة للبوت',
  async execute(client, m, args) {
    try {
      const messageObj = m.message ? m : (Array.isArray(m) ? m[0] : m);
      if (!messageObj) return;

      const chatId = m.chat || messageObj.key.remoteJid;
      // جلب رقم المستخدم بطريقة آمنة متوافقة مع Baileys
      const sender = messageObj.key.participant || messageObj.participant || chatId;
      const userId = sender.includes(':') ? sender.split(':')[0] + '@s.whatsapp.net' : sender;
      
      const userLevel = global.db?.users?.[userId]?.level || 1;
      const userMoney = global.db?.users?.[userId]?.money || 0;
      const devNumber = '212715469251@s.whatsapp.net';

      const menuImageUrl = 'https://ibb.co';

      const fullMenu = `╔═══𓆩 *𝑲𝑨𝑲𝑨𝑺𝑯𝑰 𓂆 𝑩𝑶𝑻* 𓆪═══╗\n` +
                       `║  ⚡ *لوحـة تحكـم الأوامـر المطـورة* ⚡\n` +
                       `╚════════════════════╝\n\n` +
                       `👤 *الـلاعـب:* @${userId.split('@')[0]}\n` +
                       `🏅 *المستـوى:* 『 ${userLevel} 』\n` +
                       `💰 *الرصـيد:* 『 $${userMoney} 』\n` +
                       `👑 *المطـور:* @${devNumber.split('@')[0]}\n` +
                       `🗓️ *التـاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n` +
                       `───────────────────\n\n` +
                       `🎬 ┃ *قسـم الميديـا والتنزيلات* 🎬\n` +
                       `• 🔘 ┋ *.فيديو* ↫ تحميل وفك تشفير الفيديوهات.\n\n` +
                       `🎮 ┃ *قسـم الألعاب التفاعليـة* 🎮\n` +
                       `• 🔘 ┋ *.العاب* ↫ فتح لوحة الألعاب الشاملة.\n` +
                       `• 🔘 ┋ *.العاب زواج* ↫ زواج عشوائي للأعضاء بالصور.\n` +
                       `• 🔘 ┋ *.العاب خمن* ↫ بدء تحدي تخمين الصور الذكي.\n\n` +
                       `⚔️ ┃ *قسـم النقابات والإدارة* ⚔️\n` +
                       `• 🔘 ┋ *.نقابة* ↫ عرض اللوحة الإدارية للنقابة.\n` +
                       `• 🔘 ┋ *.نقابة إنشاء* ↫ تأسيس نقابة مقاتلين جديدة.\n\n` +
                       `📦 ┃ *قسـم متجر التطبيقات* 📦\n` +
                       `• 🔘 ┋ *.تطبيق* ↫ استخراج وتحميل ملفات الأندرويد APK.\n\n` +
                       `───────────────────\n` +
                       `💡 _ضع نقطة (.) قبل الأمر لتشغيله البرمجي السليم._`;

      await client.sendMessage(chatId, { 
        image: { url: menuImageUrl },
        caption: fullMenu,
        mentions: [userId, devNumber]
      }, { quoted: messageObj });

    } catch (error) {
      console.error("❌ خطأ أثناء تنفيذ أمر القائمة:", error);
    }
  }
};
