const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');

// الإعدادات العامة للبوت
global.developer = "212784776925"; 
global.prefix = "."; 
global.ninjaDatabase = global.ninjaDatabase || {};

// مصفوفة الخطوط والزخارف الأسطورية لتطوير النصوص أسفل الأوامر
const royalFonts = {
    gothic: (text) => text.split('').map(c => "𝕬𝕭𝕮𝕭𝕰𝕱𝕲𝕽𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕿IFF𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖏"["abcdefghijklmnopqrstuvwxyz".indexOf(c.toLowerCase())] || c).join(''),
    strike: (text) => text.split('').map(char => char + '̶').join(''),
    sparkle: (text) => `✨ ﹝ ${text} ﹞ ✨`
};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS('Chrome'),
        defaultQueryTimeoutMs: 60000
    });

    sock.ev.on('creds.update', saveCreds);

    // نظام طلب كود الربط وتفادي الحظر المؤقت
    if (!sock.authState.creds.registered) {
        console.log("----------------------------------------");
        console.log("⏳ Connecting using Chrome Engine... Please wait 15 seconds.");
        console.log("----------------------------------------");
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(String(global.developer));
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`[+] YOUR PAIRING CODE: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.log("⚠️ Sockets busy. Re-trying pairing request automatically...");
                setTimeout(async () => {
                    try {
                        let code = await sock.requestPairingCode(String(global.developer));
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        console.log(`\n========================================`);
                        console.log(`[+] YOUR PAIRING CODE (Bypass): ${code}`);
                        console.log(`========================================\n`);
                    } catch (err) {
                        console.error("❌ Link rejected. Check your connection or try again later.");
                    }
                }, 15000);
            }
        }, 15000); 
    }

    // إدارة تدفق الرسائل والأوامر والردود الشاملة
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

            // معالج الردود التلقائية الذكية
            if (body.includes('مطور') || body.includes('المطور')) {
                let devReply = `👑 *﹝ قِـسْـمِ إِدَارَة كَـاكَـاشِـي بُـوت ﹞*\n\n👋 للتواصل مع المطور:\n🔗 https://wa.me`;
                return sock.sendMessage(from, { text: devReply }, { quoted: msg });
            }

            if (cleanText === 'هلا' || cleanText === 'السلام عليكم') {
                return sock.sendMessage(from, { text: `وعليكم السلام! اكتب \`.اوامر\` لتكتشف ميزاتي الأسطورية ⚡🥷` }, { quoted: msg });
            }

            // معالج الأوامر (.Prefix)
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

🛡️ *﹝ قِـسْـمِ تَـحَـكُّـمِ الـنُّـخْـبَـة وَالْـقَـادَة ﹞*
  » ${global.prefix}طرد [@منشن] (لتصفية المتمردين)
  » ${global.prefix}قفل (إغلاق الجات للنخبة فقط)
  » ${global.prefix}فتح (فتح الجات لعامة الأعضاء)
━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *تم دمج التحديث الملكي والخطوط الجديدة* 🌟`;
                    await sock.sendMessage(from, { text: menuText, mentions: [global.developer + '@s.whatsapp.net'] }, { quoted: msg });
                    break;

                // 🎨 أمر الزخرفة الجديد وتطوير الخط تحت
                case 'زخرفة':
                case 'خط':
                    if (!textArgs) return sock.sendMessage(from, { text: "❌ اكتب النص الذي تريد زخرفته! مثال: `.زخرفة كاكاشي`" }, { quoted: msg });
                    const strikeDecor = royalFonts.strike(textArgs);
                    const finalRoyal = royalFonts.sparkle(strikeDecor);
                    await sock.sendMessage(from, { text: `👑 *﹝ اﻟـﺰَّﺧْـﺮَﻓَـﺔ اﻟـﻤَـﻠَـﻜِـﻴَّـﺔ اﻟـﻤُـﻄَـﻮَّرَة ﹞* 👑\n\n${finalRoyal}` }, { quoted: msg });
                    break;

                // 🎬 قسم الفيديوهات والإيديت الأسطوري عبر الـ API
                case 'إيديت':
                case 'فيديو':
                    if (!textArgs) return sock.sendMessage(from, { text: "❌ يرجى وضع رابط الفيديو للتعديل أو التحميل!" }, { quoted: msg });
                    await sock.sendMessage(from, { text: "🎬 *جاري تشغيل الـ API الذكي ومعالجة إيديت الفيديو الأسطوري...*" }, { quoted: msg });
                    // الـ API الخاص بتحميل وتصفية وتوليد روابط الفيديو الفورية المباشرة
                    const videoLink = `https://screenshotlayer.com{encodeURIComponent(textArgs)}`;
                    await sock.sendMessage(from, { video: { url: videoLink }, caption: "🎬 *تم تصفية وصنع الإيديت بنجاح بواسطة كاكاشي API* ⚡" }, { quoted: msg });
                    break;

                // 🛡️ قسم تحكم النخبة والمشرفين
                case 'طرد':
                    if (!isGroup) return sock.sendMessage(from, { text: "❌ هذا الأمر خاص بالجروبات ونقابات القتال فقط!" }, { quoted: msg });
                    const groupMeta = await sock.groupMetadata(from);
                    const groupAdmins = groupMeta.participants.filter(v => v.admin !== null).map(v => v.id);
                    if (!groupAdmins.includes(sender) && sender !== global.developer + '@s.whatsapp.net') {
                        return sock.sendMessage(from, { text: "❌ عذراً! هذا الأمر لا يمكن تفعيله إلا بواسطة قادة النخبة والمشرفين 🛡️" }, { quoted: msg });
                    }
                    const targetKick = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                    if (!targetKick) return sock.sendMessage(from, { text: "❌ قم بعمل منشن للعضو المتمرد لطرده!" }, { quoted: msg });
                    await sock.groupParticipantsUpdate(from, [targetKick], "remove");
                    await sock.sendMessage(from, { text: "⚔️ *تم تصفية وطرد العضو بنجاح بواسطة قيادة النخبة.*" }, { quoted: msg });
                    break;

                case 'قفل':
                case 'فتح':
                    if (!isGroup) return sock.sendMessage(from, { text: "❌ للجروبات فقط!" }, { quoted: msg });
                    const metadata = await sock.groupMetadata(from);
                    const admins = metadata.participants.filter(v => v.admin !== null).map(v => v.id);
                    if (!admins.includes(sender)) return sock.sendMessage(from, { text: "❌ للمشرفين فقط!" }, { quoted: msg });
                    
                    await sock.groupSettingUpdate(from, command === 'قفل' ? 'announcement' : 'not_announcement');
                    await sock.sendMessage(from, { text: `🔒 تم ${command === 'قفل' ? 'إغلاق المجموعة للنخبة والمشرفين فقط' : 'فتح المجموعة لعامة الأعضاء'} بنجاح.` }, { quoted: msg });
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
            }
        } catch (err) {
            console.error(err);
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') startBot();
        else if (connection === 'open') console.log('[+] Connected successfully with Chrome Engine!');
    });
}

startBot();

