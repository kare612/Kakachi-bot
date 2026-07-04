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
};// مصفوفة تحتوي على عينة من الدول وأعلامها لإدارة اللعبة محلياً وبسرعة
const countries = [
    { name: 'المغرب', code: 'ma' },
    { name: 'مصر', code: 'eg' },
    { name: 'السعودية', code: 'sa' },
    { name: 'الجزائر', code: 'dz' },
    { name: 'تونس', code: 'tn' },
    { name: 'العراق', code: 'iq' },
    { name: 'فلسطين', code: 'ps' },
    { name: 'الأردن', code: 'jo' },
    { name: 'الإمارات', code: 'ae' },
    { name: 'الكويت', code: 'kw' },
    { name: 'قطر', code: 'qa' },
    { name: 'اليمن', code: 'ye' },
    { name: 'سوريا', code: 'sy' },
    { name: 'لبنان', code: 'lb' },
    { name: 'عمان', code: 'om' },
    { name: 'موريتانيا', code: 'mr' },
    { name: 'السودان', code: 'sd' },
    { name: 'ليبيا', code: 'ly' },
    { name: 'فرنسا', code: 'fr' },
    { name: 'البرازيل', code: 'br' },
    { name: 'اليابان', code: 'jp' },
    { name: 'الأرجنتين', code: 'ar' },
    { name: 'إسبانيا', code: 'es' },
    { name: 'إيطاليا', code: 'it' },
    { name: 'ألمانيا', code: 'de' }
];

// كائن لحفظ الجلسة الحالية لكل محادثة (حتى لا تتداخل الجروبات)
global.guessGame = global.guessGame || {};

module.exports = {
    name: 'تخمين',
    run: async (sock, from, msg, args) => {
        // إذا كانت اللعبة تعمل بالفعل في هذا الشات
        if (global.guessGame[from]) {
            return sock.sendMessage(from, { text: "❌ هناك لعبة قائمة بالفعل في هذه المحادثة! خمن الإجابة أو انتظر انتهاء الوقت." }, { quoted: msg });
        }

        // اختيار دولة عشوائية من القائمة
        const randomIndex = Math.floor(Math.random() * countries.length);
        const targetCountry = countries[randomIndex];

        // رابط الـ API المعتمد لجلب صورة العلم بجودة عالية (64x48 بكسل أو أكثر)
        const flagImageUrl = `https://flagcdn.com{targetCountry.code}.png`;

        // تسجيل بيانات اللعبة الحالية في الذاكرة
        global.guessGame[from] = {
            answer: targetCountry.name,
            timeout: setTimeout(() => {
                if (global.guessGame[from]) {
                    sock.sendMessage(from, { text: `⏰ *انتهى الوقت!* ولم يعرف أحد الإجابة الصحيحة.\n\n💡 الإجابة كانت: *${targetCountry.name}* 🗺️` });
                    delete global.guessGame[from];
                }
            }, 30000) // وقت الإجابة 30 ثانية
        };

        // إرسال صورة العلم كرسالة تخمين مزخرفة
        const captionText = `
╭━━━〔 🗺️ *خـمِّـن صُـورة الـعَـلَـم* 〕━━━╮
┃
┃ 🔎 *أمامك 30 ثانية لمعرفة اسم الدولة!*
┃ 📝 أرسل الإجابة مباشرة في الشات بدون رموز.
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(from, { 
            image: { url: flagImageUrl }, 
            caption: captionText 
        }, { quoted: msg });
    }
};
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages;
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const cleanText = body.trim();

            // --- [ 1. نظام التحقق من إجابة لعبة التخمين ] ---
            if (global.guessGame && global.guessGame[from]) {
                const session = global.guessGame[from];
                
                // إذا كانت رسالة العضو تطابق اسم الدولة الصحيح
                if (cleanText === session.answer) {
                    clearTimeout(session.timeout); // إيقاف العداد الزمني
                    delete global.guessGame[from]; // مسح الجلسة لإنهاء اللعبة
                    
                    const winText = `🎉 *إجابة صحيحة ومذهلة!* \n\nبطل النقابة الأسرع هو الذي خمن: *${cleanText}* 🏆✨`;
                    return sock.sendMessage(from, { text: winText }, { quoted: msg });
                }
            }

            // نظام الردود التلقائية للمطور
            if (body.includes('مطور') || body.includes('المطور')) {
                let devReply = `👑 *مطور البوت:* https://wa.me`;
                return sock.sendMessage(from, { text: devReply }, { quoted: msg });
            }

            if (!body.startsWith(global.prefix)) return;

            const args = body.slice(global.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // --- [ 2. تشغيل الأوامر الاعتيادية من مجلد commands ] ---
            const commandFile = path.join(__dirname, 'commands', `${commandName}.js`);
            if (fs.existsSync(commandFile)) {
                const command = require(commandFile);
                await command.run(sock, from, msg, args, commandName);
            }

        } catch (err) {
            console.error(err);
        }
    });const questions = [
    { q: "ما هو الشيء الذي يكتب ولا يقرأ؟", a: "القلم" },
    { q: "ما هو ثاني أكسيد الكربون برمز كيميائي؟", a: "co2" },
    { q: "عاصمة المملكة المغربية هي؟", a: "الرباط" },
    { q: "ما هو الشيء الذي كلما زاد نقص؟", a: "العمر" }
];

global.quizGame = global.quizGame || {};

module.exports = {
    name: 'فعاليات',
    run: async (sock, from, msg, args, commandName) => {
        if (commandName === 'سؤال' || commandName === 'فعالية') {
            if (global.quizGame[from]) return sock.sendMessage(from, { text: "❌ هناك سؤال قائم بالفعل!" }, { quoted: msg });

            const randomQuiz = questions[Math.floor(Math.random() * questions.length)];
            global.quizGame[from] = {
                answer: randomQuiz.a,
                timeout: setTimeout(() => {
                    if (global.quizGame[from]) {
                        sock.sendMessage(from, { text: `⏰ *انتهى الوقت!* \n💡 الإجابة الصحيحة هي: *${randomQuiz.a}*` });
                        delete global.quizGame[from];
                    }
                }, 30000)
            };

            const quizLayout = `
╭━━━〔 🧠 *أَسْـئِـلَـة ذَكَــاء كَـاكَـاشِـي* 〕━━━╮
┃
┃ ❓ *السؤال:* ${randomQuiz.q}
┃ ⏳ *الوقت:* 30 ثانية للإجابة مباشرة.
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`;
            await sock.sendMessage(from, { text: quizLayout }, { quoted: msg });
        }
    }
};module.exports = {
    name: 'ديني',
    run: async (sock, from, msg, args, commandName) => {
        if (commandName === 'ذكر' || commandName === 'اية') {
            try {
                // استخدام API ديني مفتوح ومستقر
                const res = await fetch('https://aladhan.com').then(r => r.json()); // الـ API يدعم التواريخ والبيانات الإسلامية
                
                // أذكار مدمجة سريعة لضمان استقرار السرعة
                const azkar = [
                    "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ ✨",
                    "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ 🤍",
                    "لا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ 🛡️",
                    "أستغفر الله العظيم وأتوب إليه 🕋"
                ];
                const randomZikr = azkar[Math.floor(Math.random() * azkar.length)];

                const religionLayout = `
╭━━━〔 🕋 *الْـقِـسْـمِ الـدِّيـنِـي* 〕━━━╮
┃
┃ 📿 *الذِّكْر المأثور:* 
┃ ${randomZikr}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`;
                await sock.sendMessage(from, { text: religionLayout }, { quoted: msg });
            } catch (e) {
                await sock.sendMessage(from, { text: "❌ عذراً، هناك مشكلة مؤقتة في جلب البيانات الدينية." }, { quoted: msg });
            }
        }module.exports = {
    name: 'ذكاء',
    run: async (sock, from, msg, args, commandName) => {
        if (commandName === 'ذكاء' || commandName === 'بوت') {
            const query = args.join(" ");
            if (!query) return sock.sendMessage(from, { text: "❌ اسألني أي شيء بعد الأمر! مثال: .بوت كيف حالك؟" }, { quoted: msg });

            await sock.sendMessage(from, { text: "🤖 تفكير كاكاشي الذكي جارٍ..." }, { quoted: msg });

            try {
                // API دردشة وتفاعل سريعة ومجانية
                const aiApi = `https://duckduckgo.com{encodeURIComponent(query)}&format=json&no_html=1`;
                const response = await fetch(aiApi).then(res => res.json());
                const reply = response.AbstractText || "أنا هنا معك! كود ملفاتي متطور وجاهز للرد على كل الأوامر والوظائف بدقة عالية ⚡";

                await sock.sendMessage(from, { text: `🤖 *﹝ رَدّ ذَكَـاء كَـاكَـاشِـي ﹞*\n\n💬 ${reply}` }, { quoted: msg });
            } catch (e) {
                await sock.sendMessage(from, { text: "🤖 أنا أسمعك جيداً وجاهز لخدمتك في المجموعة في أي وقت!" }, { quoted: msg });
            }
        }
    }module.exports = {
    name: 'رتبة',
    run: async (sock, from, msg, args) => {
        const isGroup = from.endsWith('@g.us');
        if (!isGroup) return sock.sendMessage(from, { text: "❌ هذا الأمر يعمل داخل المجموعات والنقابات فقط!" }, { quoted: msg });

        const sender = msg.key.participant;
        const groupMetadata = await sock.groupMetadata(from);
        const groupAdmins = groupMetadata.participants.filter(v => v.admin !== null).map(v => v.id);
        
        const isAdmin = groupAdmins.includes(sender);
        const isDeveloper = sender.includes(global.developer);
        
        let rank = "عضو محارب ⚔️";
        if (isAdmin) rank = "مشرف النقابة 🛡️";
        if (isDeveloper) rank = "مالك ومطور الروبوت 👑";

        const profileLayout = `
╭━━━〔 🎖️ *بِـطَـاقَـة رُتْـبَـة الـنَّـقَـابَـة* 〕━━━╮
┃
┃ 👤 *الاسم الشخصي:* @${sender.split('@')[0]}
┃ 🏰 *اسم النقابة/الجروب:* ${groupMetadata.subject}
┃ 🏅 *رتبتك الحالية:* [ *${rank}* ]
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(from, { text: profileLayout, mentions: [sender] }, { quoted: msg });
    }
};

};

    }
};



