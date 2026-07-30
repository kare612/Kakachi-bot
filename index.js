// يُوضع هذا الكود في المكان المخصص لمعالجة الرسائل الواردة
sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg.message || msg.key.fromMe) return; // تجاهل رسائل البوت نفسه والرسائل الفارغة

        // الحصول على نص الرسالة المرسلة
        const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        
        // تحديد بادئة الأمر (البريفكس) مثل النقطة . أو علامة !
        const prefix = "."; 
        if (!messageText.startsWith(prefix)) return;

        // فصل اسم الأمر عن المدخلات (Arguments)
        const args = messageText.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // البحث عن الأمر داخل الخريطة التي قمنا بتحميلها
        const command = commands.get(commandName);

        if (command) {
            // تشغيل دالة execute الموجودة داخل ملف الإضافة
            await command.execute(sock, msg, args);
        }
    } catch (err) {
        console.error("خطأ أثناء معالجة الأمر الأساسي:", err);
    }
});
