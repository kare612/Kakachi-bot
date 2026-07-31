import axios from 'axios';

export default {
    command: ['ذكاء', 'ai', 'بوت', 'gpt'],
    category: 'ai',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        const userPrompt = args?.join(' ') || args;

        if (!userPrompt) {
            return await sock.sendMessage(chatJid, { 
                text: '⚠️ *تنبيه:* يرجى كتابة سؤالك بعد الأمر!\n\n*مثال:* `.ذكاء كيف أصنع البوت`' 
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatJid, { text: '🤖 *جاري التفكير وصياغة الإجابة الذكية الفورية...*' }, { quoted: msg });

            // السيرفر الرئيسي المستقر
            const response = await axios.get(`https://onrender.com{encodeURIComponent(userPrompt)}`);
            const aiReply = response.data?.reply || response.data?.content;

            if (!aiReply) throw new Error("Primary AI failed");

            await sock.sendMessage(chatJid, { text: `🤖 *إجابة ذكاء كاكاشي الاصطناعي:* \n\n${aiReply}` }, { quoted: msg });

        } catch (error) {
            console.error("فشل السيرفر الرئيسي، جاري الانتقال للاحتياطي:", error);
            try {
                // نظام حماية تلقائي: الانتقال الفوري لسيرفر ذكاء اصطناعي احتياطي مفتوح ومستقر بنسبة 100%
                const backupAi = await axios.get(`https://boxmineworld.com{encodeURIComponent(userPrompt)}`);
                const backupReply = backupAi.data?.result || backupAi.data?.reply || '❌ لم أتمكن من معالجة الرد حالياً.';
                
                await sock.sendMessage(chatJid, { text: `🤖 *إجابة كاكاشي الذكي (سيرفر احتياطي):* \n\n${backupReply}` }, { quoted: msg });
            } catch (backupErr) {
                await sock.sendMessage(chatJid, { text: '❌ خوادم الذكاء الاصطناعي تخضع للصيانة المؤقتة الآن، يرجى المحاولة بعد قليل.' }, { quoted: msg });
            }
        }
    }
};
