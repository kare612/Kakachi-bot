export default {
    command: ['بينج', 'ping', 'رتبتي'],
    category: 'user',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        const userCommand = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        
        if (/بينج|ping/i.test(userCommand)) {
            const start = Date.now();
            await sock.sendMessage(chatJid, { text: '🚀 جاري الفحص...' }, { quoted: msg });
            const end = Date.now() - start;
            return await sock.sendMessage(chatJid, { text: `📶 سرعة استجابة البوت الحالية: *${end}ms*` }, { quoted: msg });
        }

        if (/رتبتي/i.test(userCommand)) {
            const isGroup = chatJid.endsWith('@g.us');
            if (!isGroup) return await sock.sendMessage(chatJid, { text: '👤 رتبتك الحالية: *مستخدم خاص بالبوت*' }, { quoted: msg });

            const metadata = await sock.groupMetadata(chatJid);
            const sender = msg.key.participant || msg.key.remoteJid;
            const isTargetAdmin = metadata.participants.find(p => p.id === sender)?.admin;

            const rank = isTargetAdmin ? '👑 مشرف في المجموعة' : '👤 عضو عادي في المجموعة';
            return await sock.sendMessage(chatJid, { text: `📊 صلاحياتك الحالية:\n\n🕵️‍♂️ العضو: @${sender.split('@')[0]}\n🏅 الرتبة: *${rank}*`, mentions: [sender] }, { quoted: msg });
        }
    }
};
