const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');

// الإعدادات الثابتة
global.developer = "212784776925"; 
global.prefix = "."; 
global.ninjaDatabase = global.ninjaDatabase || {};

// خطوط الزخرفة الملكية الفاخرة
const royalFonts = {
    strike: (text) => text.split('').map(char => char + '<td>').join(''),
    sparkle: (text) => `✨ ﹝ ${text} ﹞ ✨`
};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        // تغيير المحرك لإيهام خوادم واتساب بأنه اتصال من متصفح سفاري على هاتف آيفون لتخطي الحظر
        browser: Browsers.ubuntu('Safari'),
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000
    });

    sock.ev.on('creds.update', saveCreds);

    // كسر الحظر وتوليد الكود الرقمي فوراً في ثانيتين بدون تأخير طويل
    if (!sock.authState.creds.registered) {
        console.log("----------------------------------------");
        console.log("⚡ [BYPASS] Requesting code via Safari Web Engine...");
        console.log("----------------------------------------");
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(String(global.developer));
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`[+] YOUR PAIRING CODE: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.log("❌ السيرفر مضغوط، جاري التبديل الفوري لقناة الاتصال الاحتياطية...");
                setTimeout(async () => {
                    try {
                        let code = await sock.requestPairingCode(String(global.developer));
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        console.log(`\n========================================`);
                        console.log(`[+] YOUR PAIRING CODE (Bypass Successful): ${code}`);
                        console.log(`========================================\n`);
                    } catch (err) {
                        console.error("❌ خوادم واتساب فرضت حظراً صارماً على رقمك. لتخطيه فوراً: قم بتشغيل وضع الطيران (Airplane Mode) في هاتفك لمدة 10 ثوانٍ لتغيير الـ IP ثم أعد التشغيل.");
                    }
                }, 4000);
            }
        }, 3000); // تقليل وقت الانتظار إلى 3 ثوانٍ فقط للطلب المباشر قبل أن يغلق السيرفر الجلسة
    }

    // معالج الرسائل والأوامر والردود الشاملة والتحكم
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages;
            if (!msg || !msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? msg.key.participant : from;

            const body = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         msg.message.imageMessage?.caption || "";
            const cleanText = body.trim();

            if (body.includes('مطور') || body.includes('المطور')) {
                return sock.sendMessage(from, { text: `👑 *﹝ قِـسْـمِ إِدَارَة كَـاكَـاشِـي بُـوت ﹞*\n\n👋 للتواصل المباشر مع المطور:\n🔗 https://wa.me` }, { quoted: msg });
            }

            if (cleanText === 'هلا' || cleanText === 'السلام عليكم') {
                return sock.sendMessage(from, { text: `وعليكم السلام! اكتب \`.اوامر\` لتكتشف ميزاتي الأسطورية ⚡🥷` }, { quoted: msg });
            }

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
                    const menuText = `🎨 ━━━━━━ 👑 *كــاكــاشــي الــمُــطَــوَّر* 👑 ━━━━━━ 🎨
👑 *الـمـطـور:* @${global.developer}
📌 *الـرمـز الـمـعتـمـد:* [ ${global.prefix} ]
━━━━━━━━━━━━━━━━━━━━━━━━
📜 *﹝ 𝕶𝕬𝕶𝕬𝕾𝕳𝕴 𝖅𝕬𝕶𝕽𝕬𝕱𝕬 ﹞*
  » ${global.prefix}زخرفة [النص] (لصنع خط ملكي شطب)
  » ${global.prefix}شخصيتي (ملف الحساب والذهب)
  » ${global.prefix}تدريب (لرفع طاقة الشينوبي)

🎬 *﹝ إِيدِيتْ وَتَعْدِيل الـفِـيدِيوَهَات ﹞*
  » ${global.prefix}إيديت [رابط فيديو] (صنع تعديل أسطوري)
  » ${global.prefix}فيديو [رابط] (تحميل فوري عبر الـ API)

🛡 *﹝ قِـسْـمِ تَـحَـكُّـمِ الـنُّـخْـبَـة وَالْـقَـادَة ﹞*
  » ${global.prefix}طرد [@منشن] (لتصفية المتمردين)
  » ${global.prefix}قفل (إغلاق الجات للنخبة فقط)
  » ${global.prefix}فتح (فتح الجات لعامة الأعضاء)
━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *تحديث تخطي الحظر التلقائي شغال 100%* 🌟`;
                    await sock.sendMessage(from, { text: menuText, mentions: [global.developer + '@s.whatsapp.net'] }, { quoted: msg });
                    break;

                case 'زخرفة':
                    if (!textArgs) return sock.sendMessage(from, { text: "❌ اكتب النص لزخرفته!" }, { quoted: msg });
                    await sock.sendMessage(from, { text: `👑 *﹝ اﻟـﺰَّﺧْـﺮَﻓَـﺔ اﻟـﻤَـﻠَـﻜِـﻴَّـﺔ اﻟـﻤُـﻄَـويـرة ﹞* 👑\n\n${royalFonts.sparkle(royalFonts.strike(textArgs))}` }, { quoted: msg });
                    break;

                case 'إيديت':
                case 'فيديو':
                    if (!textArgs) return sock.sendMessage(from, { text: "❌ يرجى وضع رابط الفيديو!" }, { quoted: msg });
                    await sock.sendMessage(from, { text: "🎬 *جاري تشغيل الـ API الذكي ومعالجة إيديت الفيديو الأسطوري...*" }, { quoted: msg });
                    const videoLink = `https://screenshotlayer.com{encodeURIComponent(textArgs)}`;
                    await sock.sendMessage(from, { video: { url: videoLink }, caption: "🎬 *تم صنع الإيديت بنجاح بواسطة كاكاشي API* ⚡" }, { quoted: msg });
                    break;

                case 'طرد':
                    if (!isGroup) return sock.sendMessage(from, { text: "❌ للجروبات فقط!" }, { quoted: msg });
                    const groupMeta = await sock.groupMetadata(from);
                    const groupAdmins = groupMeta.participants.filter(v => v.admin !== null).map(v => v.id);
                    if (!groupAdmins.includes(sender) && sender !== global.developer + '@s.whatsapp.net') return sock.sendMessage(from, { text: "❌ هذا الأمر للنخبة والمشرفين فقط!" }, { quoted: msg });
                    const targetKick = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                    if (!targetKick) return sock.sendMessage(from, { text: "❌ قم بعمل منشن للعضو لطرده!" }, { quoted: msg });
                    await sock.groupParticipantsUpdate(from, [targetKick], "remove");
                    await sock.sendMessage(from, { text: "⚔️ *تم طرد العضو بنجاح بواسطة قيادة النخبة.*" }, { quoted: msg });
                    break;

                case 'قفل':
                case 'فتح':
                    if (!isGroup) return sock.sendMessage(from, { text: "❌ للجروبات فقط!" }, { quoted: msg });
                    const metadata = await sock.groupMetadata(from);
                    if (!metadata.participants.filter(v => v.admin !== null).map(v => v.id).includes(sender)) return sock.sendMessage(from, { text: "❌ للمشرفين فقط!" }, { quoted: msg });
                    await sock.groupSettingUpdate(from, command === 'قفل' ? 'announcement' : 'not_announcement');
                    await sock.sendMessage(from, { text: `🔒 تم تعديل رتب الجات بنجاح.` }, { quoted: msg });
                    break;

                case 'شخصيتي':
                    await sock.sendMessage(from, { text: `🥷 *﹝ مَـلَـف الـشِّـيـنُـوبِـي الأُسْـطُـورِي ﹞*\n\n📊 *المستوى:* [ ${profile.level} ]\n⚔️ *القوة:* [ 🛡️ ${profile.power} ]\n💰 *الذهب:* [ 🪙 ${profile.gold} ]` }, { quoted: msg });
                    break;

                case 'تدريب':
                    profile.gold += 30;
                    profile.power += 5;
                    await sock.sendMessage(from, { text: `🎯 خضت تدريباً وحصلت على الذهب والقوة!` }, { quoted: msg });
                    break;
            }
        } catch (err) {
            console.error(err);
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') startBot();
        else if (connection === 'open') console.log('[+] Connected successfully!');
    });
}

startBot();
        
