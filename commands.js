const { getChatbotResponse } = require('../api.js');

module.exports = {
    run: async (sock, from, msg, args) => {
        const text = args.join(" ");
        if (!text) return sock.sendMessage(from, { text: "اكتب سؤالك!" });
        
        const reply = await getChatbotResponse(text);
        await sock.sendMessage(from, { text: reply }, { quoted: msg });
    }
};
