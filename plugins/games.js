export default {
    command: ['زوجني', 'نسبة_الحب'],
    category: 'games',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        const isGroup = chatJid.endsWith('@g.us');
        
        if (!isGroup) return await sock.sendMessage(chatJid, { text: '❌ هذه الألعاب تعمل داخل المجموعات فقط!' }, { quoted: msg });

        const userCommand = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const metadata = await sock.groupMetadata(chatJid);
        const participants = metadata.participants;

        if (/زوجني/i.test(userCommand)) {
            // اختيار عضوين عشوائيين من الجروب
            const randomMember1 = participants[Math.floor(Math.random() * participants.length)].id;
            let randomMember2 = participants[Math.floor(Math.random() * participants.length)].id;
            
            while (randomMember1 === randomMember2) {
                randomMember2 = participants[Math.floor(Math.random() * participants.length)].id;
            }

            const text = `📊 *إعلان زواج عشوائي مفاجئ!* 💍\n\n💘 تم اختيار العروسين بنجاح:\n🤵 الزوج: @${randomMember1.split('@')[0]}\n👰 الزوجة: @${randomMember2.split('@')[0]}\n\nباركوا لهما وعقبال الجميع! 🎉`;
            
            return await sock.sendMessage(chatJid, { text: text, mentions: [randomMember1, randomMember2] }, { quoted: msg });
        }

        if (/نسبة_الحب/i.test(userCommand)) {
            const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentionedJids.length < 1) return await sock.sendMessage(chatJid, { text: '⚠️ يرجى عمل منشن لشخص واحد لقياس نسبة الحب معه!' }, { quoted: msg });

            const target = mentionedJids[0];
            const sender = msg.key.participant || msg.key.remoteJid;
            const percentage = Math.floor(Math.random() * 100) + 1;

            const loveText = `❤️ *مقياس الحب المتطور* ❤️\n\n👥 نسبة الحب بينك وبين @${target.split('@')[0]} هي: *${percentage}%* 📊`;
            return await sock.sendMessage(chatJid, { text: loveText, mentions: [target] }, { quoted: msg });
        }
    }
};
