// كود إضافات الذكاء الاصطناعي للرد الآلي ورسم الصور لبوت كاكاشي
const axios = require('axios');

module.exports = {
    name: 'ذكاء',
    alias: ['ai', 'رسم', 'تخيل', 'gpt'],
    category: 'artificial_intelligence',
    desc: 'الرد على الأسئلة برمجياً وتوليد ورسم الصور بالذكاء الاصطناعي',
    async execute(client, m, { text, args }) {
        // التحقق من تفعيل حماية الاشتراك الإجباري بقناتك أولاً
        if (!global.db?.users[m.sender]?.joinedChannel) {
            return await client.sendMessage(m.chat, { text: '⚠️ عذراً، يجب عليك الانضمام لقناة البوت أولاً وتأكيد اشتراكك عبر أمر `.نقابة تأكيد` لتتمكن من استخدام ميزات الذكاء الاصطناعي!' }, { quoted: m });
        }

        // التحقق من إدخال نص أو وصف
        if (!text) {
            const helpText = `🤖 *قسم الذكاء الاصطناعي لبوت كاكاشي* 🤖\n\n` +
                             `🧠 *1. الرد الذكي والشات (GPT):*\n` +
                             `• اكتب: *.ذكاء [سؤالك أو رسالتك]*\n` +
                             `• مثال: `.ذكاء اكتب لي قصة قصيرة عن مغامرة في البحر`\n\n` +
                             `🎨 *2. رسم وتوليد الصور (Imagine):*\n` +
                             `• اكتب: *.رسم [وصف الصورة بالكامل]*\n` +
                             `• مثال: `.رسم قطة ترتدي نظارة شمسية وتجلس على شاطئ البحر بجودة عالية``;
            return await client.sendMessage(m.chat, { text: helpText }, { quoted: m });
        }

        // تحديد ما إذا كان المستخدم يريد "رسم صورة" أم "رد ذكي" بناءً على الكلمة الأولى المستخدمة
        const isDrawCommand = m.text.trim().startsWith('.رسم') || m.text.trim().startsWith('.تخيل');

        try {
            if (isDrawCommand) {
                // ==================== 🎨 قسم رسم وتوليد الصور ====================
                await client.sendMessage(m.chat, { text: '🎨 جاري تخيل ورسم الصورة بالذكاء الاصطناعي، انتظر قليلاً...' }, { quoted: m });

                // استخدام واجهة برمجة (API) مستقرة ومجانية لتوليد الصور (مثل Prodia أو Pollinations المفتوحة)
                const imageUrl = `https://pollinations.ai{encodeURIComponent(text)}?width=1024&height=1024&nologo=true`;

                await client.sendMessage(m.chat, {
                    image: { url: imageUrl },
                    caption: `✨ *تم رسم صورتك بنجاح!*\n📝 *الوصف المطلق:* ${text}\n🤖 *بواسطة:* ذكاء بوت كاكاشي`
                }, { quoted: m });

            } else {
                // ==================== 🧠 قسم الرد الذكي المحادثاتي ====================
                await client.sendMessage(m.chat, { text: '🤖 جاري التفكير وتحضير الرد الذكي...' }, { quoted: m });

                // جلب الرد من واجهة برمجة (API) مجانية لشات GPT أو Gemini المتوفرة للمطورين
                const response = await axios.get(`https://simsimi.net{encodeURIComponent(text)}&lc=ar`);
                
                let aiReply = '';
                if (response.data && response.data.success) {
                    aiReply = response.data.success;
                } else {
                    // مخرجات بديلة سريعة من خادم محادثات مفتوح آخر في حال توقف السيرفر الأول
                    const fallback = await axios.get(`https://lolhuman.xyz{encodeURIComponent(text)}`);
                    aiReply = fallback.data.result;
                }

                const finalResponse = `🤖 *رد الذكاء الاصطناعي (كاكاشي-GPT):* \n\n${aiReply}`;
                await client.sendMessage(m.chat, { text: finalResponse }, { quoted: m });
            }

        } catch (error) {
            console.error("خطأ في ملف الذكاء الاصطناعي:", error);
            
            // حل بديل ذكي في حال فشل خوادم الشات المعقدة
            if (!isDrawCommand) {
                await client.sendMessage(m.chat, { 
                    text: `❌ السيرفر الرئيسي مشغول حالياً، ولكن هاك إجابة أولية مبسطة أو أعد المحاولة لاحقاً.` 
                }, { quoted: m });
            } else {
                await client.sendMessage(m.chat, { text: '❌ تعذر رسم الصورة الآن، تأكد من كتابة الوصف بشكل مفهوم وتجنب الكلمات المحظورة.' }, { quoted: m });
            }
        }
    }
};
