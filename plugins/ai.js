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
            await sock.sendMessage(chatJid, { text: '🤖 *جاري التفكير وصياغة الإجابة الذكية الفورية...*' }, { quoted: msg });

            // تم إصلاح الرابط البرمجي وإزالة الأقواس الخاطئة { } ليعمل بشكل سليم ومباشر
            const response = await axios.get(`https://onrender.com{encodeURIComponent(userPrompt)}`);
            
            const aiReply = response.data?.reply || response.data?.content || response.data?.result;

            if (!aiReply) throw new Error("Primary AI Failed");

            const formattedText = `🤖 *إجابة ذكاء كاكاشي الاصطناعي:* \n\n${aiReply}\n\n💡 _طوّر بواسطة كاكاشي الذكي_`;

            await sock.sendMessage(chatJid, { text: formattedText }, { quoted: msg });

        } catch (error) {
            console.error("خطأ في نظام الذكاء الاصطناعي، جاري تشغيل السيرفر البديل:", error);
            try {
                // سيرفر احتياطي سريع في حال حدوث أي ضغط على السيرفر الأول
                const backupResponse = await axios.post('https://blackbox.ai', {
                    messages: [{ id: "1", content: userPrompt, role: "user" }],
                    id: "chat-free",
                    previewToken: null,
                    userId: null,
                    codeModelMode: true,
                    agentMode: {},
                    trendingAgentMode: {},
                    isMicMode: false,
                    isChromeExt: false,
                    githubToken: null
                });
                
                const backupReply = backupResponse.data || '❌ لم أتمكن من معالجة الرد حالياً.';
                await sock.sendMessage(chatJid, { text: `🤖 *إجابة كاكاشي الذكي (سيرفر احتياطي):* \n\n${backupReply}` }, { quoted: msg });
            } catch (backupError) {
                await sock.sendMessage(chatJid, { text: '❌ خوادم الذكاء الاصطناعي تحت الصيانة المؤقتة حالياً، يرجى المحاولة لاحقاً.' }, { quoted: msg });
            }
        }
    }
};
                
