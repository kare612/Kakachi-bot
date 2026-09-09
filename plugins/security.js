security.js// قائمة الكلمات الحساسة والسيئة التي تتسبب في الطرد الفوري
const badWords = ["سب1", "سب2", "كلمة_سيئة", "منيوك", "قحبة", "شرموط"]; 

module.exports = {
    name: 'الحماية_الصارمة',
    async onMessage(conn, msg) {
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        // التحقق من أن الرسالة داخل جروب
        if (!isGroup) return;

        // جلب نوع الرسالة ومحتواها
        const type = Object.keys(msg.message || {})[0];
        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        const sender = msg.key.participant || msg.key.remoteJid;

        // 1. فحص الروابط (Anti-Link)
        const hasLink = /(https?:\/\/[^\s]+)/gi.test(body) || body.includes('://whatsapp.com');
        
        // 2. فحص الكلمات السيئة والحساسة (Anti-Badwords)
        const hasBadWord = badWords.some(word => body.toLowerCase().includes(word.toLowerCase()));

        // 3. فحص جهات الاتصال (Anti-Vcard)
        const isContact = type === 'contactMessage' || type === 'contactsArrayMessage';

        // 4. فحص الملصقات السيئة (Anti-Sticker)
        const isSticker = type === 'stickerMessage';

        // إذا ارتكب العضو أي من المخالفات المذكورة
        if (hasLink || hasBadWord || isContact || isSticker) {
            
            // جلب بيانات الجروب للتحقق من الرتب
            const groupMetadata = await conn.groupMetadata(from);
            const participants = groupMetadata.participants;
            const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            
            const isBotAdmin = participants.find(p => p.id === botNumber)?.admin;
            const isSenderAdmin = participants.find(p => p.id === sender)?.admin;

            // إذا كان المخالف مشرفاً (Admin) في الجروب، يتجاهله البوت تماماً لحمايته
            if (isSenderAdmin) return;

            // إذا كان البوت مشرفاً، يبدأ بتطبيق العقوبة فوراً
            if (isBotAdmin) {
                try {
                    // أولاً: حذف الرسالة/الملصق المخالف
                    await conn.sendMessage(from, { delete: msg.key });
                    
                    // تحديد سبب الطرد لإرساله في الجروب
                    let reason = "";
                    if (isSticker) reason = "إرسال ملصق (ممنوع منعا باتاً)";
                    if (hasLink) reason = "نشر روابط وإعلانات للجروبات";
                    if (hasBadWord) reason = "استخدام كلمات حساسة أو سباب";
                    if (isContact) reason = "مشاركة كروت وجهات اتصال";

                    // ثانياً: طرد العضو المخالف فوراً من المجموعة
                    await conn.groupParticipantsUpdate(from, [sender], 'remove');

                    // ثالثاً: إرسال رسالة تأكيد الطرد لباقي الأعضاء ليكون عبرة
                    await conn.sendMessage(from, { 
                        text: `🚨 **تم طرد العضو المخالف فوراً!**\n\n👤 **المستخدم:** @${sender.split('@')[0]}\n⚠️ **السبب:** ${reason}\n🛡️ **النظام:** حماية الجروب الصارمة مُفعلة تلقائياً.`, 
                        mentions: [sender] 
                    });

                } catch (error) {
                    console.log("حدث خطأ أثناء محاولة الطرد أو الحذف: ", error);
                }
            }
        }
    }
};
