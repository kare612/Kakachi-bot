// أنماط زخرفة النصوص المدعومة (إنجليزية وعربية)
const decorationStyles = {
    1: (text) => text.split('').join(' ̶') + '̶',
    2: (text) => `✨ ( ${text} ) ✨`,
    3: (text) => `⚡ ⌊ ${text} ⌉ ⚡`,
    4: (text) => ` 👑 〖 ${text} 〗 👑`,
    5: (text) => text.split('').map(char => char.toUpperCase()).join(' ')
};

module.exports = {
    // 1. أمر الزخرفة المطلوب
    'زخرفة': async (sock, from, args) => {
        if (args.length === 0) {
            return await sock.sendMessage(from, { text: '⚠️ يرجى كتابة النص المراد زخرفته بعد الأمر.\nمثال:\n.زخرفة كاكاشي' });
        }
        const text = args.join(' ');
        let replyText = `🎨 *نتائج زخرفة روبوت كاكاشي لنص:* "${text}"\n\n`;
        replyText += `1️⃣ ${decorationStyles[1](text)}\n`;
        replyText += `2️⃣ ${decorationStyles[2](text)}\n`;
        replyText += `3️⃣ ${decorationStyles[3](text)}\n`;
        replyText += `4️⃣ ${decorationStyles[4](text)}\n`;
        replyText += `5️⃣ ${decorationStyles[5](text)}`;
        
        await sock.sendMessage(from, { text: replyText });
    },

    // 2. أمر فحص عمل واستجابة البوت
    'تست': async (sock, from) => {
        await sock.sendMessage(from, { text: '🤖 روبوت كاكاشي المطور يعمل بنجاح وبأعلى كفاءة لخدمتك!' });
    },

    // 3. أمر المساعدة لعرض قائمة الأوامر المتاحة
    'الاوامر': async (sock, from) => {
        let menu = `⚡ *قائمة أوامر روبوت كاكاشي المطور* ⚡\n\n`;
        menu += `📌 *.تست* ⬅️ لفحص ما إذا كان البوت متصلاً.\n`;
        menu += `📌 *.زخرفة [النص]* ⬅️ لزخرفة النصوص بـ 5 أشكال مميزة.\n`;
        menu += `📌 *.المطور* ⬅️ لعرض معلومات مطور البوت.\n\n`;
        menu += `💡 _ملاحظة: يمكنك استخدام النقطة (.) أو علامة التعجب (!) قبل كل أمر._`;
        
        await sock.sendMessage(from, { text: menu });
    },

    // 4. أمر المطور لعرض بياناتك
    'المطور': async (sock, from) => {
        const developerInfo = `👑 *مطور البوت هو:* صاحب الرقم المطور\n📱 *رقم المطور:* +212784776925\n🤖 *إصدار البوت:* كاكاشي V1.0.0`;
        await sock.sendMessage(from, { text: developerInfo });
    }
};module.exports = {
    // ---- [ قسم الأوامر والردود العامة ] ----
    "السلام عليكم": "وعليكم السلام ورحمة الله وبركاته يا غالي! ✨",
    "هلا": "هلا بيك! كيف يمكن لروبوت كاكاشي مساعدتك اليوم؟ 🤖",
    "شكرا": "العفو! أنا في الخدمة دائمًا. 🤍",
    "بوت": "نعم! أنا روبوت كاكاشي المطور، أرسل `.الاوامر` لعرض ما يمكنني فعله.",
    "صباح الخير": "صباح النور والسرور! ☀️ يومك سعيد ومبارك.",
    "مساء الخير": "مساء الورد والياسمين! ✨",
    "من انت": "أنا روبوت كاكاشي، بوت واتساب مطور لخدمتك وتلبية أوامرك.",
    "المطور": "مطور البوت هو صاحب الرقم المطور: +212784776925 👑",
    
    // ---- [ يمكنك إضافة مئات الأوامر والردود أدناه بنفس الطريقة ] ----
    "رابط": "تفضل رابط مجموعتنا الرسمية: [ضع الرابط هنا] 🔗",
    "قوانين": "الرجاء احترام الأعضاء وعدم إرسال روابط غير مصرح بها لعدم الحظر! 🚫",
    "تفعيل": "تم تفعيل الحماية والرد التلقائي بنجاح داخل الدردشة! ✅",
    "تعطيل": "تم تعطيل الرد التلقائي مؤقتًا! ❌",
    "تحميل": "يرجى إرسال رابط الفيديو المراد تحميله بعد الأمر مباشرة. 📥",
    
    // أضف أي سطر جديد هنا بنفس التركيبة: "الأمر": "الرد"،
};

             // استدعاء ملف الردود التلقائية المليء بآلاف الأوامر
const autoReplies = require('./replies.js');

// أنماط زخرفة النصوص المدعومة
const decorationStyles = {
    1: (text) => text.split('').join(' ̶') + '̶',
    2: (text) => `✨ ( ${text} ) ✨`,
    3: (text) => `⚡ ⌊ ${text} ⌉ ⚡`,
    4: (text) => `👑 〖 ${text} 〗 👑`,
    5: (text) => text.split('').map(char => char.toUpperCase()).join(' ')
};

module.exports = {
    // 1. أمر الزخرفة المطور
    'زخرفة': async (sock, from, args) => {
        if (args.length === 0) {
            return await sock.sendMessage(from, { text: '⚠️ يرجى كتابة النص المراد زخرفته بعد الأمر.\nمثال:\n.زخرفة كاكاشي' });
        }
        const text = args.join(' ');
        let replyText = `🎨 *نتائج زخرفة روبوت كاكاشي لنص:* "${text}"\n\n`;
        replyText += `1️⃣ ${decorationStyles[1](text)}\n`;
        replyText += `2️⃣ ${decorationStyles[2](text)}\n`;
        replyText += `3️⃣ ${decorationStyles[3](text)}\n`;
        replyText += `4️⃣ ${decorationStyles[4](text)}\n`;
        replyText += `5️⃣ ${decorationStyles[5](text)}`;
        
        await sock.sendMessage(from, { text: replyText });
    },

    // 2. أمر فحص استجابة البوت
    'تست': async (sock, from) => {
        await sock.sendMessage(from, { text: '🤖 روبوت كاكاشي المطور يعمل بنجاح وبأعلى كفاءة لخدمتك!' });
    },

    // 3. أمر المساعدة وعرض القائمة الرئيسية
    'الاوامر': async (sock, from) => {
        let menu = `⚡ *قائمة أوامر روبوت كاكاشي المطور* ⚡\n\n`;
        menu += `📌 *.تست* ⬅️ لفحص اتصال البوت.\n`;
        menu += `📌 *.زخرفة [النص]* ⬅️ لزخرفة النصوص بـ 5 أشكال.\n`;
        menu += `📌 *آلاف الردود التلقائية* ⬅️ البوت يرد تلقائيًا على الكلمات المخزنة بملف الردود.\n\n`;
        menu += `💡 _ملاحظة: اكتب الكلمة مباشرة أو ضع قبلها (.) أو (!) ليرد البوت._`;
        
        await sock.sendMessage(from, { text: menu });
    },

    // 4. المحرك الذكي للرد على آلاف الأوامر التلقائية المخزنة في replies.js
    'handleAutoReply': async (sock, from, text) => {
        // تنظيف النص من الرموز الزائدة لتسهيل التعرف عليه
        const cleanText = text.replace(/[.!]/g, '').trim();

        // فحص إذا كانت الكلمة موجودة في قائمة الردود التلقائية المليونية
        if (autoReplies[cleanText]) {
            await sock.sendMessage(from, { text: autoReplies[cleanText] });
            return true; // تم العثور على الرد وإرساله
        }
        return false; // الكلمة ليست أمرًا مخزنًا
    }
};    // معالج استقبال الرسائل والأوامر
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        if (!text) return;

        try {
            const commands = require('./commands.js');

            // 1. أولاً: فحص إذا كانت الرسالة عبارة عن أمر مباشر يبدأ بنقطة أو علامة تعجب
            if (text.startsWith('.') || text.startsWith('!')) {
                const args = text.slice(1).trim().split(/ +/);
                const commandName = args.shift().toLowerCase();

                if (commands[commandName]) {
                    await commands[commandName](sock, from, args, msg);
                    return; // إنهاء التنفيذ إذا كان أمرًا رئيسيًا مفعلاً
                }
            }

            // 2. ثانياً: إذا لم تكن أمرًا رئيسيًا، يفحص محرك الرد التلقائي لآلاف الكلمات
            await commands.handleAutoReply(sock, from, text);

        } catch (error) {
            console.error('خطأ في معالجة الأوامر والردود التلقائية:', error);
        }
    });

        
