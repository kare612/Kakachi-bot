// الكود الداخلي المصلح لملف apk.cjs في قسم execute
async execute(client, m, args) {
    const messageObj = m.message ? m : (Array.isArray(m) ? m[0] : m);
    const chatId = m.chat || messageObj.key.remoteJid;
    const text = args ? args.join(' ') : '';

    if (!text) {
        return await client.sendMessage(chatId, { 
            text: '⚠️ يرجى كتابة اسم التطبيق أو اللعبة بعد الأمر.\nمثال:\n.تطبيق whatsapp' 
        }, { quoted: messageObj });
    }
    // بقية كود الملف لطلب الـ axios كما هو دون تغيير...
