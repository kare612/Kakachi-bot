export default {
    command: ['ping', 'بينج'],
    category: 'user',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        await sock.sendMessage(chatJid, { 
            text: '🚀 *بـوت كـاكـاشـي شـغـال!* الاتصال سليم والأوامر تعمل بنجاح.' 
        }, { quoted: msg });
    }
};
