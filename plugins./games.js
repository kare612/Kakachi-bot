export default {
    name: 'العاب',
    alias: ['زوجني', 'نسبة_الحب', 'سؤال', 'صورة'],
    category: 'user',
    async execute(client, msg, args) {
        const chatJid = msg.key.remoteJid;
        const cmd = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        // === 1. لعبة الزواج العشوائي بالصور (زوجني) ===
        if (cmd.includes('زوجني')) {
            if (!chatJid.endsWith('@g.us')) {
                return await client.sendMessage(chatJid, { text: '⚠️ هذه اللعبة تعمل داخل المجموعات فقط!' }, { quoted: msg });
            }

            // جلب أعضاء المجموعة واختيار شخصين عشوائياً
            const groupMetadata = await client.groupMetadata(chatJid);
            const participants = groupMetadata.participants.map(p => p.id);
            
            if (participants.length < 2) return;
            
            const user1 = participants[Math.floor(Math.random() * participants.length)];
            let user2 = participants[Math.floor(Math.random() * participants.length)];
            
            while (user1 === user2) {
                user2 = participants[Math.floor(Math.random() * participants.length)];
            }

            const weddingText = `💖 *إعلان زواج عشوائي داخل المجموعـة!* 💖\n\n💍 العريس الأسطوري: @${user1.split('@')[0]}\n👰 العروسة الفاتنة: @${user2.split('@')[0]}\n\n✨ باركوا للعروسين وعقبال الباقي! 🎉`;
            
            // رابط صورة تعبيرية للزواج من الـ API
            const imageUrl = "https://picsum.photos" + Date.now();

            await client.sendMessage(chatJid, { 
                image: { url: imageUrl }, 
                caption: weddingText,
                mentions: [user1, user2]
            }, { quoted: msg });
        }

        // === 2. لعبة نسبة الحب وعلاقات الأعضاء ===
        else if (cmd.includes('نسبة_الحب')) {
            const percentage = Math.floor(Math.random() * 101);
            let loveIcon = percentage > 50 ? "❤️" : "💔";
            
            const loveText = `📊 *مقياس الحب والانسجام العشوائي* 📊\n\n💞 النسبة بينكما هي: *${percentage}%* ${loveIcon}\n\n💡 _ملاحظة: اللعبة للترفيه والتسلية فقط!_`;
            const loveImg = "https://picsum.photos" + percentage;

            await client.sendMessage(chatJid, { 
                image: { url: loveImg }, 
                caption: loveText 
            }, { quoted: msg });
        }

        // === 3. لعبة سؤال وجواب تفاعلية مع صورة ===
        else if (cmd.includes('سؤال')) {
            const questions = [
                "ما هو الشيء الذي يكتب ولا يقرأ؟",
                "ما هو الكوكب الأكثر سخونة في النظام الشمسي؟",
                "من هو المطور الأسطوري لبوت كاكاشي؟",
                "شيء يملك أسناناً كثيرة لكنه لا يعض؟"
            ];
            const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
            
            const questionText = `❓ *تحدي الأسئلة والذكاء* ❓\n\nأجب على السؤال التالي في التعليقات:\n📝 *"${randomQuestion}"*`;
            const questionImg = "https://picsum.photos" + Date.now();

            await client.sendMessage(chatJid, { 
                image: { url: questionImg }, 
                caption: questionText 
            }, { quoted: msg });
        }

        // === 4. جلب صورة عشوائية ومميزة ===
        else if (cmd.includes('صورة')) {
            await client.sendMessage(chatJid, { text: '🔄 جاري جلب صورة مميزة وعالية الدقة من الـ API...' }, { quoted: msg });
            const randomImg = "https://picsum.photos" + Date.now();

            await client.sendMessage(chatJid, { 
                image: { url: randomImg }, 
                caption: "📷 تم جلب الصورة العشوائية بنجاح بواسطة بوت كاكاشي!" 
            }, { quoted: msg });
        }
    }
};
