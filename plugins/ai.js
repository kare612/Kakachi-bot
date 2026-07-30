import axios from 'axios';

export default {
    command: ['ذكاء', 'ai', 'بوت', 'gpt'],
    category: 'ai',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        const userPrompt = args?.join(' ') || args;

        if (!userPrompt) {
            return await sock.sendMessage(chatJid, { 
                text: '⚠️ *تنبيه:* يرجى كتابة سؤالك بعد الأمر!\n\n*مثال:* `.ذكاء كيف أصنع كعكة؟`' 
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatJid, { text: '🤖 *جاري التفكير وصياغة الإجابة الذكية...*' }, { quoted: msg });

            // الاتصال بنظام الذكاء الاصطناعي المباشر والمجاني
            const response = await axios.get(`https://boxmineworld.com{encodeURIComponent(userPrompt)}`);
            
            const aiReply = response.data?.result || response.data?.reply || '❌ لم أتمكن من معالجة الرد حالياً، جرب صياغة أخرى.';

            const formattedText = `🤖 *إجابة ذكاء كاكاشي الاصطناعي:* \n\n${aiReply}\n\n💡 _طوّر بواسطة كاكاشي الذكي_`;

            await sock.sendMessage(chatJid, { text: formattedText }, { quoted: msg });

        } catch (error) {
            console.error("خطأ في نظام الذكاء الاصطناعي:", error);
            await sock.sendMessage(chatJid, { text: '❌ واجه خادم الذكاء الاصطناعي صعوبة مؤقتة في الاتصال، أعد المحاولة لاحقاً.' }, { quoted: msg });
        }
    }
};
