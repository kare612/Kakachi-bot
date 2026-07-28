// كود إضافات ألعاب تفاعلية بالصور لبوت كاكاشي
import axios from 'axios';

export default {
    name: 'العاب',
    alias: ['لعبة', 'العاب_بوت', 'games'],
    category: 'games',
    desc: 'أوامر ألعاب تفاعلية وممتعة بالصور والأعضاء',
    async execute(client, m, args) { // تم تصحيح الباراميترز لتتوافق مع ملف index.js الخاص بك
        const command = args[0] ? args[0].toLowerCase() : '';

        // قفل حماية للتأكد من تشغيل الألعاب في المجموعات فقط لألعاب الزواج
        const isGroup = m.chat.endsWith('@g.us');

        // جلب قائمة المشاركين في الجروب بشكل صحيح من كليشة الواتساب
        let participants = [];
        if (isGroup) {
            try {
                const groupMetadata = await client.groupMetadata(m.chat);
                participants = groupMetadata.participants || [];
            } catch (err) {
                console.error('خطأ في جلب بيانات المجموعة:', err);
            }
        }

        // قائمة الألعاب المتاحة للمستخدم عند كتابة (.العاب) فقط
        if (!command) {
            const menuText = `🎮 *قائمة ألعاب بوت كاكاشي* 🎮\n\n` +
                             `1️⃣ *.العاب زواج* — اختيار زوجين عشوائيين من الجروب بالصور.\n` +
                             `2️⃣ *.العاب خمن* — لعبة تخمين الشخصية أو الصورة (تحتاج إنترنت).\n\n` +
                             `💡 اكتب الأمر بدقة مثل: *.العاب زواج*`;
            return await client.sendMessage(m.chat, { text: menuText }, { quoted: m });
        }

        // ==================== 1️⃣ لعبة الزواج العشوائي ====================
        if (command === 'زواج' || command === 'اتزوج') {
            if (!isGroup) return await client.sendMessage(m.chat, { text: '❌ هذه اللعبة مخصصة للمجموعات فقط!' }, { quoted: m });
            
            // اختيار شخصين عشوائيين من أعضاء الجروب
            const memberList = participants.map(p => p.id);
            if (memberList.length < 2) return await client.sendMessage(m.chat, { text: '⚠️ عدد أعضاء الجروب قليل جداً لبدء اللعبة!' }, { quoted: m });

            const husband = memberList[Math.floor(Math.random() * memberList.length)];
            let wife = memberList[Math.floor(Math.random() * memberList.length)];
            
            // التأكد من عدم اختيار نفس الشخص
            while (husband === wife) {
                wife = memberList[Math.floor(Math.random() * memberList.length)];
            }

            try {
                // جلب صورة بروفايل الزوج
                let husbandPic;
                try {
                    husbandPic = await client.profilePictureUrl(husband, 'image');
                } catch {
                    husbandPic = 'https://telegra.ph'; // صورة افتراضية شغالة
                }

                const weddingText = `🔔 *إعلان زواج ملكي في المجموعة!* 🔔\n\n` +
                                    `👑 *العريس:* @${husband.split('@')[0]}\n` +
                                    `💍 *العروس الكريمة:* @${wife.split('@')[0]}\n\n` +
                                    `🎉 ألف مبروك للزوجين السعيدين! ننتظر توزيع الحلوى في الجروب. 🥳✨`;

                await client.sendMessage(m.chat, {
                    image: { url: husbandPic },
                    caption: weddingText,
                    mentions: [husband, wife]
                }, { quoted: m });

            } catch (err) {
                console.error(err);
                await client.sendMessage(m.chat, { text: '❌ حدث خطأ أثناء إعداد حفلة الزواج!' }, { quoted: m });
            }
        }

        // ==================== 2️⃣ لعبة خمن الصورة ====================
        if (command === 'خمن' || command === 'صورة') {
            try {
                // جلب صورة عشوائية وسؤال من قائمة داخلية جاهزة
                const gameImages = [
                    { url: 'https://unsplash.com', answer: 'اسد' },
                    { url: 'https://unsplash.com', answer: 'قطة' },
                    { url: 'https://unsplash.com', answer: 'بحر' }
                ];
                
                const randomGame = gameImages[Math.floor(Math.random() * gameImages.length)];

                const challengeText = `🧩 *لعبة خمن ما في الصورة!* 🧩\n\n` +
                                      `🤔 ماذا ترى في هذه الصورة؟\n` +
                                      `💡 اكتب إجابتك في الشات (الجروب لديه 30 ثانية لمعرفتها).\n\n` +
                                      `|| لمعرفة الإجابة السرية: ${randomGame.answer} ||`; // نص مخفي في الواتساب

                await client.sendMessage(m.chat, {
                    image: { url: randomGame.url },
                    caption: challengeText
                }, { quoted: m });

            } catch (error) {
                console.error(error);
                await client.sendMessage(m.chat, { text: '❌ تعذر تحميل لعبة التخمين الآن.' }, { quoted: m });
            }
        }
    }
};
                    
