const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

// الإعدادات العامة للبوت
global.developer = "212784776925"; // رقم هاتفك المعتمد
global.prefix = "."; // رمز تشغيل الأوامر
global.ninjaDatabase = global.ninjaDatabase || {};
global.guessGame = global.guessGame || {};

async function startBot() {
    // تحديد مجلد حفظ جلسة الاتصال لمنع تكرار طلب الكود
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false // تعطيل الـ QR ليعمل الكود الرقمي
    });

    sock.ev.on('creds.update', saveCreds);

    // نظام مطور وذكي لطلب كود الربط الرقمي وتفادي الخطأ 428
    if (!sock.authState.creds.registered) {
        console.log("⏳ جاري الاتصال بخوادم واتساب لتوليد كود الربط الخاص بك... انتظر قليلاً");
        
        // زيادة وقت الانتظار إلى 7 ثوانٍ لضمان استقرار السوكت بالكامل
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(global.developer);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`[+] كود الربط الرقمي الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.log("⏳ خوادم واتساب مشغولة، جاري إعادة المحاولة التلقائية بعد ثوانٍ...");
                
                // محاولة ثانية تلقائية في حال حدوث ضغط مؤقت في الشبكة
                setTimeout(async () => {
                    try {
                        let code = await sock.requestPairingCode(global.developer);
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        console.log(`\n========================================`);
                        console.log(`[+] كود الربط الرقمي (محاولة ثانية): ${code}`);
                        console.log(`========================================\n`);
                    } catch (err) {
                        console.error("❌ فشل الاتصال، تأكد من جودة الإنترنت في هاتف أو جرب لاحقاً.");
                    }
                }, 6000);
            }
        }, 7000); 
    }

    // مستمع ومعالج الرسائل والأوامر الشامل
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg || !msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? msg.key.participant : from;

            // قراءة الرسائل بجميع صيغها (نصية، ممتدة، أو وصوف صور) لضمان عدم الصمت
            const body = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         msg.message.imageMessage?.caption || "";
            const cleanText = body.trim();

            // --- [ نظام الألعاب: تخمين أعلام الدول ] ---
            if (global.guessGame && global.guessGame[from]) {
                if (cleanText === global.guessGame[from].answer) {
                    clearTimeout(global.guessGame[from].timeout);
                    delete global.guessGame[from];
                    return sock.sendMessage(from, { text: `🎉 *إجابة صحيحة مذهلة!* \n\nبطل النقابة الأسرع هو الذي خمن اسم الدولة الصحيح 🏆✨` }, { quoted: msg });
                }
            }

            // --- [ نظام الرد التلقائي المباشر للمطور ] ---
            if (body.includes('مطور') || body.includes('المطور') || body.includes('المالك')) {
                let devReply = `👑 *﹝ إدارة كاكاشي بوت ﹞*\n\n👋 للتواصل المباشر مع المطور اضغط هنا:\n🔗 https://wa.me`;
                return sock.sendMessage(from, { text: devReply }, { quoted: msg });
            }

            // التحقق من رمز الأمر ومقاطعة الرسائل العادية
            if (!body.startsWith(global.prefix)) return;

            const args = body.slice(global.prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            // تفعيل داتا الشخصيات القتالية تلقائياً للعضو
            if (!global.ninjaDatabase[sender]) {
                global.ninjaDatabase[sender] = { level: 1, xp: 0, gold: 100, power: 50, wins: 0 };
            }
            const profile = global.ninjaDatabase[sender];

            // --- [ معالجة الأوامر الشاملة ] ---
            switch (command) {
                case 'اوامر':
                case 'أوامر':
                case 'menu':
                    const menuText = `✨ ━━━━━━ 🌟 *كــاكــاشــي بــوت* 🌟 ━━━━━━ ✨
👑 *الـم_طـور:* @${global.developer}
📌 *الـرمـز الـمـعتـمـد:* [ ${global.prefix} ]
━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ *﹝ أواﻣِـﺮ الـقِـتـال والألْـعَـاب ﹞*
  » ${global.prefix}شخصيتي (ملف الحساب والذهب)
  » ${global.prefix}تدريب (لرفع طاقة الشينوبي)
  » ${global.prefix}تخمين (لعبة أعلام الدول)

🛡️ *﹝ أواﻣِـﺮ الـجُـروبَـات واﻟـﻨِّـﻘـﺎﺑـﺎت ﹞*
  » ${global.prefix}قفل (إغلاق الجات للمشرفين)
  » ${global.prefix}فتح (فتح الجات للجميع)
━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *تمت الصيانة الشاملة للبوت بنجاح* 🌟`;
                    await sock.sendMessage(from, { text: menuText, mentions: [global.developer + '@s.whatsapp.net'] }, { quoted: msg });
                    break;

                case 'شخصيتي':
                    await sock.sendMessage(from, { text: `🥷 *﹝ مَـلَـف الـشِّـيـنُـوبِـي الأُسْـطُـورِي ﹞*\n\n📊 *المستوى:* [ ${profile.level} ]\n⚔️ *القوة:* [ 🛡️ ${profile.power} ]\n💰 *الذهب:* [ 🪙 ${profile.gold} ]\n🏆 *الانتصارات:* [ ${profile.wins} ]` }, { quoted: msg });
                    break;

                case 'تدريب':
                    const gainedGold = Math.floor(Math.random() * 40) + 10;
                    profile.gold += gainedGold;
                    profile.power += 5;
                    await sock.sendMessage(from, { text: `🎯 لقد خضت تدريباً شاقاً وحصلت على:\n🪙 +${gainedGold} ذهب\n🛡️ +5 قوة إضافية!` }, { quoted: msg });
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

                case 'قفل':
                case 'فتح':
                    if (!isGroup) return sock.sendMessage(from, { text: "❌ للجروبات فقط!" }, { quoted: msg });
                    const metadata = await sock.groupMetadata(from);
                    const admins = metadata.participants.filter(v => v.admin !== null).map(v => v.id);
                    if (!admins.includes(sender)) return sock.sendMessage(from, { text: "❌ للمشرفين فقط!" }, { quoted: msg });
                    
                    await sock.groupSettingUpdate(from, command === 'قفل' ? 'announcement' : 'not_announcement');
                    await sock.sendMessage(from, { text: `🔒 تم ${command === 'قفل' ? 'قفل' : 'فتح'} الجروب بنجاح.` }, { quoted: msg });
                    break;
            }
        } catch (err) {
            console.error(err);
        }
    });

    // إعادة الاتصال التلقائي والذكي في حال حدوث أي انقطاع للإنترنت في الهاتف
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('[+] كاكاشي بوت متصل ويعمل بنظام الحماية والرد الشامل والمباشر!');
        }
    });
}

startBot();
                
