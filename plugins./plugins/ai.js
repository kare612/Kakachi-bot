import axios from 'axios';

export default {
    name: 'ذكاء',
    alias: ['gpt', 'سوال', 'ai', 'اسأل'],
    category: 'user',
    async execute(client, msg, args) {
        const chatJid = msg.key.remoteJid;
        const userQuestion = args.join(' ');

        // التحقق من أن المستخدم كتب سؤالاً بعد الأمر
        if (!userQuestion) {
            return await client.sendMessage(chatJid, { 
                text: '⚠️ *تنبيه:* يرجى كتابة السؤال أو الاستفسار المراد طرحه بعد الأمر مباشرة.\n\n💡 *مثال:* `.ذكاء كم عدد الكواكب في النظام الشمسي؟`' 
            }, { quoted: msg });
        }

        // إرسال رسالة مؤقتة تشير إلى أن الذكاء الاصطناعي يفكر ويستخرج الإجابة
        const thinkingMsg = await client.sendMessage(chatJid, { text: '🤖 ¦ جاري التفكير وتحليل سؤالك، يرجى الانتظار لحظات...' }, { quoted: msg });

        try {
            // الاتصال بخادم الـ API المجاني المتاح لمعالجة وإجابة النصوص
            const response = await axios.get(`https://vreden.web.id{encodeURIComponent(userQuestion)}`);
            
            // استخراج نص الإجابة من الـ API
            const aiAnswer = response.data?.result || response.data?.response;

            if (!aiAnswer) {
                throw new Error('لم يتم استلام رد صالح من خادم الذكاء الاصطناعي');
            }

            // إرسال الإجابة النهائية المنسقة للمستخدم داخل شات الواتساب
            const finalReply = `💡 *[ إجابة الذكاء الاصطناعي لبوت كاكاشي ]* 🤖\n\n💬 *سؤالك:* ${userQuestion}\n\n✨ *الإجابة:* ${aiAnswer}`;
            
            await client.sendMessage(chatJid, { text: finalReply }, { quoted: msg });

            // حذف رسالة التفكير المؤقتة
            await client.sendMessage(chatJid, { delete: thinkingMsg.key });

        } catch (error) {
            console.error('خطأ في معالجة سؤال الذكاء الاصطناعي:', error);
            
            // إخطار المستخدم في حال حدوث عطل في الخادم أو انقطاع الاتصال بالـ API
            await client.sendMessage(chatJid, { 
                text: '❌ *فشل الرد:* عذراً، نواجه ضغطاً على خوادم الذكاء الاصطناعي حالياً. يرجى محاولة طرح سؤالك مجدداً بعد قليل.' 
            }, { quoted: msg });
        }
    }
};
