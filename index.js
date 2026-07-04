const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

// الإعدادات العامة للبوت
global.developer = "212784776925"; 
global.prefix = "."; 
global.ninjaDatabase = global.ninjaDatabase || {};
global.guessGame = global.guessGame || {};
global.quizGame = global.quizGame || {};

// قائمة أسئلة الفعاليات
const quizQuestions = [
    { q: "ما هو ثاني أكسيد الكربون برمزه الكيميائي؟", a: "co2" },
    { q: "عاصمة المملكة المغربية الشريفة هي؟", a: "الرباط" },
    { q: "ما هو الشيء الذي كلما زاد نقص؟", a: "العمر" }
];

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    // نظام طلب كود الربط الرقمي لـ Termux
    if (!sock.authState.creds.registered) {
        console.log("⏳ جاري الاتصال بخوادم واتساب لتوليد كود الربط الخاص بك...");
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(global.developer);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`[+] كود الربط الرقمي الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.error("خطأ في طلب الرمز، جاري المحاولة تلقائياً...");
            }
        }, 7000); 
    }

    // إدارة تدفق الرسائل والأوامر والردود الشاملة
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg || !msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? msg.key.participant : from;

            const body = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         msg.message.imageMessage?.caption || "";
            const cleanText = body.trim();

            // 1. معالج الردود التلقائية والألعاب
            if (global.guessGame && global.guessGame[from]) {
                if (cleanText === global.guessGame[from].answer) {
                    clearTimeout(global.guessGame[from].timeout);
                    delete global.guessGame[from];
                    return sock.sendMessage(from, { text: `🎉 *إجابة صحيحة مذهلة وسريعة!* \n\nلقد حزرت اسم الدولة الصحيح بنجاح! 🏆✨` }, { quoted: msg });
                }
            }

            if (global.quizGame && global.quizGame[from]) {
                if (cleanText.toLowerCase() === global.quizGame[from].answer.toLowerCase()) {
                    clearTimeout(global.quizGame[from].timeout);
                    delete global.quizGame[from];
                    return sock.sendMessage(from, { text: `🧠 *عبقري! إجابتك صحيحة ودقيقة جداً تضاف لنقاط ذكائك!* 🏆🎉` }, { quoted: msg });
                }
            }

            if (body.includes('مطور') || body.includes('المطور') || body.includes('المالك')) {
                let devReply = `👑 *﹝ قِـسْـمِ إِدَارَة كَـاكَـاشِـي بُـوت ﹞*\n\n👋 للتواصل المباشر مع مطور البوت اضغط هنا:\n🔗 https://wa.me`;
                return sock.sendMessage(from, { text: devReply }, { quoted: msg });
            }

            if (cleanText === 'هلا' || cleanText === 'السلام عليكم') {
                return sock.sendMessage(from, { text: `وعليكم السلام ورحمة الله وبركاته! اكتب \`.اوامر\` لتكتشف ميزاتي الأسطورية ⚡🥷` }, { quoted: msg });
            }

            // 2. معالج الأوامر (.Prefix)
            if (!body.startsWith(global.prefix)) return;

            const args = body.slice(global.prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            const textArgs = args.join(" ");

            if (!global.ninjaDatabase[sender]) {
                global.ninjaDatabase[sender] = { level: 1, gold: 100, power: 50 };
            }
            const profile = global.ninjaDatabase[sender];

            switch (command) {
                case 'اوامر':
                case 'أوامر':
                case 'menu':
                    const menuText = `✨ ━━━━━━ 🌟 *كــاكــاشــي بــوت* 🌟 ━━━━━━ ✨
👑 *الـمـطـور:* @${global.developer}
📌 *الـرمـز الـمـعتـمـد:* [ ${global.prefix} ]
━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ *﹝ أواﻣِـﺮ الـقِـتـال والألْـعَـاب ﹞*
  » ${global.prefix}شخصيتي (ملف الحساب والذهب)
  » ${global.prefix}تدريب (لرفع طاقة الشينوبي)
  » ${global.prefix}تخمين (لعبة أعلام الدول)
  » ${global.prefix}سؤال (مسابقة الذكاء السريعة)

🎥 *﹝ أواﻣِـﺮ اﻟـﻤِـﻴـديـا واﻟـﺒَـﺤْـﺚ ﹞*
  » ${global.prefix}فيديو [رابط فيديو] (تحميل ميديا)
  » ${global.prefix}بحث [كلمة] (البحث الذكي في الويب)
━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *تم إصلاح مشكلة الصمت وتوحيد المعالجات* 🌟`;
                    await sock.sendMessage(from, { text: menuText, mentions: [global.developer + '@s.whatsapp.net'] }, { quoted: msg });
                    break;

                case 'شخصيتي':
                    await sock.sendMessage(from, { text: `🥷 *﹝ مَـلَـف الـشِّـيـنُـوبِـي الأُسْـطُـورِي ﹞*\n\n📊 *المستوى:* [ ${profile.level} ]\n⚔️ *القوة القتالية:* [ 🛡️ ${profile.power} ]\n💰 *الذهب الحالي:* [ 🪙 ${profile.gold} ]` }, { quoted: msg });
                    break;

                case 'تدريب':
                    const gainedGold = Math.floor(Math.random() * 40) + 10;
                    profile.gold += gainedGold;
                    profile.power += 5;
                    await sock.sendMessage(from, { text: `🎯 *لقد خضت تدريباً شاقاً وحصلت على:*\n🪙 +${gainedGold} ذهب ملكي\n🛡️ +5 قوة قتالية إضافية!` }, { quoted: msg });
                    break;

                case 'تخمين':
                    if (global.guessGame[from]) return sock.sendMessage(from, { text: "❌ هناك لعبة قائمة بالفعل!" }, { quoted: msg });
                    global.guessGame[from] = {
                        answer: "المغرب",
                        timeout: setTimeout(() => {
                            if (global.guessGame[from]) {
                                sock.sendMessage(from, { text: `⏰ *انتهى الوقت!* الإجابة الصحيحة كانت: *المغرب* 🇲🇦` });
                                delete global.guessGame[from];
                            }
                        }, 30000)
                    };
                    await sock.sendMessage(from, { image: { url: 'https://flagcdn.com' }, caption: "🗺️ *خـمِّـن صُـورة الـعَـلَـم التالي لتربح الجائزة!*" }, { quoted: msg });
                    break;

                case 'سؤال':
                    if (global.quizGame[from]) return sock.sendMessage(from, { text: "❌ هناك سؤال قائم بالفعل!" }, { quoted: msg });
                    const randomQuiz = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
                    global.quizGame[from] = {
                        answer: randomQuiz.a,
                        timeout: setTimeout(() => {
                            if (global.quizGame[from]) {
                                sock.sendMessage(from, { text: `⏰ *انتهى الوقت!* الإجابة كانت: *${randomQuiz.a}*` });
                                delete global.quizGame[from];
                            }
                        }, 30000)
                    };
                    await sock.sendMessage(from, { text: `❓ *سؤال ذكاء كاكاشي:* \n\n${randomQuiz.q}\n\n⏳ أمامك 30 ثانية للإجابة مباشرة في الشات!` }, { quoted: msg });
                    break;

                case 'فيديو':
                    if (!textArgs) return sock.sendMessage(from, { text: "❌ يرجى وضع رابط الفيديو!" }, { quoted: msg });
                    await sock.sendMessage(from, { text: "⏳ جاري تشغيل الـ API وتحميل الفيديو الخاص بك..." }, { quoted: msg });
                    const videoLink = `https://screenshotlayer.com{encodeURIComponent(textArgs)}`;
                    await sock.sendMessage(from, { video: { url: videoLink }, caption: "🎬 *تم التحميل بنجاح عبر كاكاشي API* ⚡" }, { quoted: msg });
                    break;

                case 'بحث':
                    if (!textArgs) return sock.sendMessage(from, { text: "❌ اكتب الموضوع المراد البحث عنه!" }, { quoted: msg });
                    try {
                        const response = await fetch(`https://duckduckgo.com{encodeURIComponent(textArgs)}&format=json&no_html=1`).then(res => res.json());
                        const result = response.AbstractText || "❌ لم يتم العثور على خلاصة موسوعية كافية لهذا الموضوع.";
                        await sock.sendMessage(from, { text: `🔍 *﹝ نَـتَـائِـج الـبَـحْـثِ الـذَّكِـيِّ ﹞*\n\n📌 *الموضوع:* ${textArgs}\n📖 *الخلاصة:* ${result}` }, { quoted: msg });
                    } catch {
                        await sock.sendMessage(from, { text: "❌ عذراً، هناك مشكلة مؤقتة في خادم جلب الـ API الخارجي للبحث." }, { quoted: msg });
                    }
                    break;
            }
        } catch (err) {
            console.error(err);
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') startBot();
        else if (connection === 'open') console.log('[+] كاكاشي بوت متصل ومستقر ويعمل بنظام الرد الموحد!');
    });
}

startBot();
                                           
