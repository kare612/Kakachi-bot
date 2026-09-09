// قائمة الكلمات الحساسة، السب، الإباحية، والتهديد بالتبنيد التي تتسبب في الطرد الفوري
const badWords = [
    "سب1", "سب2", "منيوك", "قحبة", "شرموط", "كس", "زب", "طيز", "عرص", "خنيث",
    "اغتصب", "اغتصاب", "نيك", "تناك", "شذوذ", "بورن", "سكس", "مقطع+18", "اباحي",
    "تبييد", "بند", "ابندك", "تبنيد_ارقام", "حظر_رقم", "سيرفر", "كود_حظر", "هكر"
]; 

module.exports = {
    name: 'الحماية_القصوى',
    async onMessage(conn, msg) {
        try {
            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            
            // تجاهل الرسالة إذا لم تكن في مجموعة أو إذا كانت رسالة فارغة
            if (!isGroup || !msg.message) return;

            // تحديد نوع ومحتوى الرسالة
            const type = Object.keys(msg.message)[0];
            const sender = msg.key.participant || msg.key.remoteJid;
            
            // جلب النص البرمي سواء كان رسالة عادية أو نصاً مصاحباً لصورة/فيديو
            const body = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || 
                         msg.message?.imageMessage?.caption || 
                         msg.message?.videoMessage?.caption || "";

            // --- فحص المخالفات الحساسة لحماية البوت من البند ---
            
            // 1. فحص الروابط (Anti-Link)
            const hasLink = /(https?:\/\/[^\s]+)/gi.test(body) || 
                            body.includes('://whatsapp.com') || 
                            body.includes('wa.me');
            
            // 2. فحص الكلمات السيئة والحساسة (Anti-Badwords)
            const hasBadWord = badWords.some(word => body.toLowerCase().includes(word.toLowerCase()));

            // 3. فحص جهات الاتصال (Anti-Vcard) لمنع كروت الأرقام الوهمية أو الملغمة
            const isContact = type === 'contactMessage' || type === 'contactsArrayMessage';

            // 4. فحص الملصقات (Anti-Sticker) لمنع التبنيد عبر الملصقات الإباحية والملغمة
            const isSticker = type === 'stickerMessage';

            // إذا ارتكب العضو غير المشرف أي من هذه المخالفات
            if (hasLink || hasBadWord || isContact || isSticker) {
                
                // جلب بيانات الجروب للتحقق من الرتب والمسؤولين
                const groupMetadata = await conn.groupMetadata(from);
                const participants = groupMetadata.participants;
                const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
                
                const isBotAdmin = participants.find(p => p.id === botNumber)?.admin;
                const isSenderAdmin = participants.find(p => p.id === sender)?.admin;

                // حماية المشرفين (الآدمن) من الطرد التلقائي
                if (isSenderAdmin) return;

                // إذا كان البوت مشرفاً، يطبق العقوبة الفورية لحماية الحساب والجروب
                if (isBotAdmin) {
                    // أولاً: حذف الرسالة/الملصق/الرابط فوراً
                    await conn.sendMessage(from, { delete: msg.key });
                    
                    // تحديد سبب العقوبة المكتوب في المجموعة
                    let reason = "";
                    if (isSticker) reason = "إرسال ملصق (ممنوع منعاً باتاً لسلامة الرقم من البند)";
                    if (hasLink) reason = "نشر روابط أو إعلانات مجموعات خارجية";
                    if (hasBadWord) reason = "استخدام كلمات نابية، إباحية، أو عبارات تهديد بالتبنيد";
                    if (isContact) reason = "مشاركتك لجهات اتصال وكروت أرقام غير مسموحة";

                    // ثانياً: طرد العضو المخالف بدون إنذار
                    await conn.groupParticipantsUpdate(from, [sender], 'remove');

                    // ثالثاً: إرسال تنبيه صارم لبقية الأعضاء في المجموعة
                    await conn.sendMessage(from, { 
                        text: `🚨 **رادار الحماية الصارمة!**\n\n👤 **المخالف:** @${sender.split('@')[0]}\n⚠️ **السبب:** ${reason}\n🔨 **العقوبة:** الطرد الفوري وحذف المخالفة.\n\n🔒 _تم تنظيف الجروب وحماية البوت بنجاح._`, 
                        mentions: [sender] 
                    });
                }
            }
        } catch (error) {
            console.error("خطأ في نظام الحماية: ", error);
        }
    }
};
