const fs = require('fs');
const path = require('path');

// تعريف قواعد البيانات المحلية المشتركة للأنظمة التفاعلية
global.ninjaDatabase = global.ninjaDatabase || {};
global.guessGame = global.guessGame || {};
global.quizGame = global.quizGame || {};
global.bountySystem = global.bountySystem || {};

// المتجر الأسطوري لشراء المعدات
const blackMarket = {
    'سيف': { cost: 300, powerBonus: 40, desc: "🗡️ سيف الكوزاناجي لرفع قوة ضرباتك" },
    'درع': { cost: 250, powerBonus: 25, desc: "🛡️ درع تشاكرا متطور لحمايتك من الغرامات" }
};

// قائمة الأسئلة للفعاليات الترفيهية
const quizQuestions = [
    { q: "ما هو ثاني أكسيد الكربون برمزه الكيميائي؟", a: "co2" },
    { q: "عاصمة المملكة المغربية الشريفة هي؟", a: "الرباط" },
    { q: "ما هو الشيء الذي كلما زاد نقص؟", a: "العمر" }
];

async function handleCommand(sock, from, msg, body) {
    try {
        if (!body.startsWith(global.prefix)) return;

        const args = body.slice(global.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const textArgs = args.join(" ");
        const sender = from.endsWith('@g.us') ? msg.key.participant : from;

        // تفعيل ملف شخصية العضو تلقائياً
        if (!global.ninjaDatabase[sender]) {
            global.ninjaDatabase[sender] = { level: 1, xp: 0, gold: 100, power: 50, wins: 0 };
        }
        const profile = global.ninjaDatabase[sender];

        // استدعاء ملف الـ API الخارجي
        const apiEngine = require('./api.js');

        switch (commandName) {
            // 📜 قائمة الأوامر المزخرفة بالكامل
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

💰 *﹝ أواﻣِـﺮ الـسُّـوق وَالْـجَـرَائـم ﹞*
  » ${global.prefix}متجر (السوق السوداء والأسلحة)
  » ${global.prefix}شراء [اسم السلاح] (تطوير هجومك)
  » ${global.prefix}سرقة [@عضو] (نهب ذهب الأعضاء)

🎥 *﹝ أواﻣِـﺮ اﻟـﻤِـﻴـديـا واﻟـﺒَـﺤْـﺚ ﹞*
  » ${global.prefix}فيديو [رابط فيديو] (تحميل ميديا)
  » ${global.prefix}بحث [كلمة] (البحث الذكي في الويب)
━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *تم تفعيل معالج الأوامر المنفصل بنجاح* 🌟`;
                await sock.sendMessage(from, { text: menuText, mentions: [global.developer + '@s.whatsapp.net'] }, { quoted: msg });
                break;

            // 🥷 نظام تطوير الشخصيات
            case 'شخصيتي':
                await sock.sendMessage(from, { text: `🥷 *﹝ مَـلَـف الـشِّـيـنُـوبِـي الأُسْـطُـورِي ﹞*\n\n📊 *المستوى:* [ ${profile.level} ]\n⚔️ *القوة القتالية:* [ 🛡️ ${profile.power} ]\n💰 *الذهب الحالي:* [ 🪙 ${profile.gold} ]\n🏆 *الانتصارات:* [ ${profile.wins} ]` }, { quoted: msg });
                break;

            case 'تدريب':
                const gainedGold = Math.floor(Math.random() * 40) + 10;
                profile.gold += gainedGold;
                profile.power += 5;
                await sock.sendMessage(from, { text: `🎯 *لقد خضت تدريباً شاقاً وحصلت على:*\n🪙 +${gainedGold} ذهب ملكي\n🛡️ +5 قوة قتالية إضافية!` }, { quoted: msg });
                break;

            // 🎮 نظام ألعاب الجروبات والتفاعل
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
                // سحب الصورة الآمنة من محرك الـ API الشامل
                const flagUrl = apiEngine.getFlagApi("ma");
                await sock.sendMessage(from, { image: { url: flagUrl }, caption: "🗺️ *خـمِّـن صُـورة الـعَـلَـم التالي لتربح الجائزة!*" }, { quoted: msg });
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

            // 🏪 متجر الأسلحة والسوق السوداء
            case 'متجر':
            case 'السوق':
                let shopLayout = `🏪 *﹝ سُـوق كَـاكَـاشِـي الـسَّـوْدَاء ﹞* 🏪\n\n🪙 ذهبك الحالي: [ ${profile.gold} ]\n`;
                shopLayout += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                for (const [item, info] of Object.entries(blackMarket)) {
                    shopLayout += `📦 *العنصر:* ${global.prefix}شراء ${item}\n💰 *السعر:* ${info.cost} | ⚡ *القوة:* +${info.powerBonus}\n📝 ${info.desc}\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                }
                await sock.sendMessage(from, { text: shopLayout }, { quoted: msg });
                break;

            case 'شراء':
                if (!blackMarket[textArgs]) return sock.sendMessage(from, { text: "❌ هذا العنصر غير موجود بالمتجر!" }, { quoted: msg });
                const item = blackMarket[textArgs];
                if (profile.gold < item.cost) return sock.sendMessage(from, { text: `❌ ذهبك لا يكفي! تحتاج ${item.cost} ذهب.` }, { quoted: msg });
                profile.gold -= item.cost;
                profile.power += item.powerBonus;
                await sock.sendMessage(from, { text: `🛍️ *تمت عملية الشراء بنجاح!* \nلقد حصلت على *${textArgs}* وزادت قوتك بمقدار +${item.powerBonus} ⚡` }, { quoted: msg });
                break;

            case 'سرقة':
                const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                if (!mentioned) return sock.sendMessage(from, { text: "❌ قم بعمل منشن للضحية! مثال: `.سرقة @عضو`" }, { quoted: msg });
                if (mentioned === sender) return sock.sendMessage(from, { text: "❌ لا يمكنك سرقة نفسك!" }, { quoted: msg });
                
                const success = Math.random() > 0.5;
                if (success) {
                    const stolen = Math.floor(Math.random() * 30) + 10;
                    profile.gold += stolen;
                    global.ninjaDatabase[mentioned] = global.ninjaDatabase[mentioned] || { level: 1, gold: 100, power: 50 };
                    global.ninjaDatabase[mentioned].gold -= stolen;
                    await sock.sendMessage(from, { text: `🥷 *سرقة ناجحة!* لقد تسللت لغرفته ونهبت منه 🪙 *${stolen}* ذهب!` }, { quoted: msg });
                } else {
                    profile.gold = Math.max(0, profile.gold - 20);
                    await sock.sendMessage(from, { text: `🚨 *أمسك بك الحراس!* فشلت السرقة وتم تغريمك 🪙 *20* ذهب من حسابك!` }, { quoted: msg });
                }
                break;

            // 📡 تشغيل أوامر الـ ميديا والبحث المتصلة بملف الـ API المنفصل
            case 'فيديو':
                if (!textArgs) return sock.sendMessage(from, { text: "❌ يرجى وضع رابط الميديا المراد تحميلها!" }, { quoted: msg });
                await sock.sendMessage(from, { text: "⏳ جاري تشغيل خوادم الـ API وتحميل الفيديو الخاص بك..." }, { quoted: msg });
                const videoLink = apiEngine.getVideoDownloadApi(textArgs);
                await sock.sendMessage(from, { video: { url: videoLink }, caption: "🎬 *تمت عملية التحميل بنجاح عبر كاكاشي API* ⚡" }, { quoted: msg });
                break;

            case 'بحث':
                if (!textArgs) return sock.sendMessage(from, { text: "❌ اكتب الموضوع المراد البحث عنه!" }, { quoted: msg });
                await sock.sendMessage(from, { text: `🔍 جاري الفحص وجلب البيانات السريعة عبر الـ API...` }, { quoted: msg });
                const searchResult = await apiEngine.fetchSearchData(textArgs);
                await sock.sendMessage(from, { text: `🔍 *﹝ نَـتَـائِـج الـبَـحْـثِ الـذَّكِـيِّ ﹞*\n\n📌 *الموضوع:* ${textArgs}\n📖 *الخلاصة:* ${searchResult}` }, { quoted: msg });
                break;
        }
    } catch (err) {
        console.error(err);
    }
}

module.exports = { handleCommand };
