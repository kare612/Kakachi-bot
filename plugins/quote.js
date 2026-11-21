module.exports = {
    name: 'quote',
    aliases: ['اقتباس', 'حكمة'],
    async execute(sock, m, args, remoteJid) {
        const quotes = [
            "في أعمق الظلام، يولد أقوى المحاربين.",
            "لا تثق بكل وجه يبتسم لك، فالأقنعة أصبحت رخيصة.",
            "الصمت هو اللغة التي لا يفهمها إلا من ذاق مرارة الخذلان.",
            "الوحوش الحقيقية لا تختبئ تحت السرير، بل تسكن في العقول.",
            "من يمشي وحيداً في الليل، لا يخشى خيانة الرفاق.",
            "القوة الحقيقية هي أن تبتسم بينما تحترق من الداخل."
        ];
        const random = quotes[Math.floor(Math.random() * quotes.length)];
        await sock.sendMessage(remoteJid, { text: `🕯️ *همسة من الظلام:*\n\n"${random}"` }, { quoted: m });
    }
};
