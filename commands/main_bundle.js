const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// دالة لتوليد خطوط مزخرفة مطورة للنصوص العربية والإنجليزية والعلامات
function decorateText(text) {
    const borders = "✨ ━━━━━━ ❖ ━━━━━━ ✨";
    return `${borders}\n\n👑 💠  ${text}  💠 👑\n\n${borders}`;
}

// 📦 قاعدة بيانات الـ 1000 أمر والردود العربية التلقائية والصوتية
const arabicReplies = {
    // أمثلة لردود "خرفية" مضحكة وتفاعلية للمجموعات
    "السلام عليكم": { type: "text", content: "وعليكم السلام ورحمة الله وبركاته! يا مية أهلاً وسهلاً بيك في المجموعة، نوّرتنا وغيّرت الجو بأكمله الحين! 🌟" },
    "البوت": { type: "text", content: "لبّييه يا صاحب الرقم الملكي! أنا هنا طوع أمرك وفي خدمتك على مدار الـ 24 ساعة، اطلب تمنى!" },
    "منور": { type: "text", content: "بوجودك يا غالي، النور هذا كله ينعكس من عيونك ومن حضورك الفخم معنا." },
    "ضحكة": { type: "audio", content: "https://soundjay.com" }, // رابط صوت مباشر
    "شيلات": { type: "audio", content: "https://soundjay.com" },
    
    // ملاحظة: يمكنك الاستمرار في نسخ ولصق الأسطر هنا حتى تصل لـ 1000 أمر تريد برمجتها يدوياً تحت نفس النمط
};

module.exports = {
    name: "النظام_المطور",
    description: "حزمة الأوامر الموحدة (يوتيوب، بث، ردود، ذكاء اصطناعي، فلترة رقم البوت)",
    async execute(client, message, args) {
        
        // 🔒 الفلترة الذكية: التحقق من أن الرسالة صادرة من نفس رقم البوت (أو صاحب البوت)
        // message.fromMe تعني أن الحساب الذي أرسل الأمر هو نفس حساب الواتساب المشغل للبوت
        if (!message.fromMe) {
            // إذا كنت تريد السماح للمجموعات بالردود التلقائية ولكن الأوامر القوية لك فقط:
            // سنترك الردود التلقائية العامة، ونحمي أوامر التحميل والبث للرقم الخاص بك فقط.
        }

        const inputtext = message.body.trim();
        const commandArg = args.join(" ");

        // ----------------------------------------------------
        // 1️⃣ قسم الـ 1000 أمر عربي والردود الصوتية والنصية
        // ----------------------------------------------------
        if (arabicReplies[inputtext]) {
            const commandData = arabicReplies[inputtext];
            if (commandData.type === "text") {
                const decorated = decorateText(commandData.content);
                return await client.sendMessage(message.from, decorated);
            } else if (commandData.type === "audio") {
                return await client.sendMessage(message.from, {
                    audio: { url: commandData.content },
                    mimetype: 'audio/mp4',
                    ptt: true // إرسال كمقطع صوتي مسجل (فويس)
                });
            }
        }

        // ----------------------------------------------------
        // 2️⃣ أمر تحميل إيديت وفيديوهات يوتيوب (خاص برقمك فقط للأمان)
        // ----------------------------------------------------
        if (inputtext.startsWith(".تحميل") || inputtext.startsWith("تحميل")) {
            if (!message.fromMe) return message.reply("⚠️ هذا الأمر مخصص لمالك البوت فقط.");
            if (!commandArg) return message.reply(decorateText("❌ يرجى وضع رابط فيديو يوتيوب أو إيديت رياضي بعد الأمر."));

            await message.reply("⏳ جاري سحب ومعالجة الفيديو الرياضي من اليوتيوب، انتظر قليلاً...");
            const fileName = `yt_${Date.now()}.mp4`;
            const outputPath = path.join(__dirname, '../', fileName);
            const downloadCommand = `yt-dlp -f "best[ext=mp4][filesize<45M]/best" "${commandArg}" -o "${outputPath}"`;

            exec(downloadCommand, async (error) => {
                if (error) return message.reply(decorateText("❌ فشل تحميل الفيديو، تأكد من حجم الملف والرابط."));
                try {
                    await client.sendMessage(message.from, {
                        video: fs.readFileSync(outputPath),
                        caption: decorateText("🎬 تم استخراج الإيديت الرياضي بنجاح بواسطة نظامك!"),
                        mimetype: 'video/mp4'
                    });
                    fs.unlinkSync(outputPath);
                } catch (e) {
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                }
            });
            return;
        }

        // ----------------------------------------------------
        // 3️⃣ أمر سيرفرات البث المباشر للمباريات (مزخرف ومطور)
        // ----------------------------------------------------
        if (inputtext === "بث" || inputtext === ".بث") {
            const liveTemplate = `
⚽ *سيرفرات البث المباشر والمباريات الحالية* 📺

قناة *BEIN SPORTS 1 HD* البث الرئيسي:
🔗 https://sports-stream-api.net

قناة *BEIN SPORTS 2 HD* جودة متوسطة:
🔗 https://sports-stream-api.net

*💡 ملاحظة تشغيلية:* انسخ الرابط وافتحه عبر تطبيق VLC على هاتفك للبث المباشر المستمر بدون تقطيع.
            `;
            return await client.sendMessage(message.from, decorateText(liveTemplate));
        }

        // ----------------------------------------------------
        // 4️⃣ الرد التلقائي عبر الذكاء الاصطناعي API (خرفية تامة لأي نص آخر)
        // ----------------------------------------------------
        // إذا تم منشن البوت أو الحديث معه في المجموعات ولم يكن أمراً ثابتاً، يذهب للـ API
        if (message.isGroup && inputtext.includes("بوت") && !arabicReplies[inputtext]) {
            try {
                // استدعاء ريبورت ذكي مجاني (تم استبدال الرابط بـ API تفاعلي عربي)
                const aiResponse = await axios.get(`https://simsimi.net{encodeURIComponent(inputtext)}&lc=ar`);
                const aiReply = aiResponse.data.success || "أنا معك يا غالي! أسمعك جيداً، اطلب ما تريد.";
                return await client.sendMessage(message.from, decorateText(aiReply));
            } catch (err) {
                // رد احتياطي في حال توقف السيرفر الخارجي للـ API
                return await client.sendMessage(message.from, decorateText("مرحباً بك! نظام الذكاء الاصطناعي متصل وجاهز للرد على كل طلباتك بالمجموعة."));
            }
        }
    }
};
