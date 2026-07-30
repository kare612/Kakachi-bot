import axios from 'axios';

export default {
    command: ['ذكاء', 'ai', 'بوت', 'gpt'],
    category: 'ai',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        const userPrompt = args?.join(' ') || args;

        if (!userPrompt) {
            return await sock.sendMessage(chatJid, { 
                text: '⚠️ *تنبيه:* يرجى كتابة سؤالك بعد الأمر!\n\n*مثال:* `.ذكاء كيف حالك`' 
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatJid, { text: '🤖 *جاري التفكير وصياغة الإجابة الذكية...*' }, { quoted: msg });

            // استخدام سيرفر بديل فائق السرعة والاستقرار للذكاء الاصطناعي
            const response = await axios.get(`https://onrender.com{encodeURIComponent(userPrompt)}`);
            
            const aiReply = response.data?.reply || response.data?.content || '❌ لم أتمكن من معالجة الرد حالياً.';

            const formattedText = `🤖 *إجابة ذكاء كاكاشي الاصطناعي:* \n\n${aiReply}\n\n💡 _طوّر بواسطة كاكاشي الذكي_`;

            await sock.sendMessage(chatJid, { text: formattedText }, { quoted: msg });

        } catch (error) {
            console.error("خطأ في نظام الذكاء الاصطناعي:", error);
            await sock.sendMessage(chatJid, { text: '❌ واجه خادم الذكاء الاصطناعي صعوبة مؤقتة، أعد المحاولة لاحقاً.' }, { quoted: msg });
        }
    }
};
        
