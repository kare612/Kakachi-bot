const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

// الإعدادات العامة الشاملة للبوت
global.developer = "212784776925"; // الرقم ممرر كنص نقي وثابت
global.prefix = "."; 
global.ninjaDatabase = global.ninjaDatabase || {};
global.guessGame = global.guessGame || {};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    // نظام طلب كود الربط وتفادي الحظر المؤقت
    if (!sock.authState.creds.registered) {
        console.log("----------------------------------------");
        console.log("⏳ Connecting to WhatsApp servers... Please wait 10 seconds.");
        console.log("----------------------------------------");
        
        setTimeout(async () => {
            try {
                // تمرير رقم هاتف المطور كنص خالص لمنع خطأ الـ Sockets
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
                        console.log(`[+] YOUR PAIRING CODE (Retry): ${code}`);
                        console.log(`========================================\n`);
                    } catch (err) {
                        console.error("❌ Request rejected by WhatsApp servers. Try changing connection or restart Termux.");
                    }
                }, 10000);
            }
        }, 10000); 
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

            if (body.includes('مطور') || body.includes('المطور')) {
                let devReply = `👑 *﹝ قِـسْـمِ إِدَارَة كَـاكَـاشِـي بُـوت ﹞*\n\n👋 للتواصل مع المطور:\n🔗 https://wa.me`;
                return sock.sendMessage(from, { text: devReply }, { quoted: msg });
            }

            if (cleanText === 'هلا' || cleanText === 'السلام عليكم') {
                return sock.sendMessage(from, { text: `وعليكم السلام! اكتب \`.اوامر\` لتكتشف ميزاتي الأسطورية ⚡🥷` }, { quoted: msg });
            }

            if (!body.startsWith(global.prefix)) return;

            const args = body.slice(global.prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

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
━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *تم تفعيل نظام المعالجة الموحد بنجاح* 🌟`;
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
            }
        } catch (err) {
            console.error(err);
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') startBot();
        else if (connection === 'open') console.log('[+] Connected successfully to WhatsApp!');
    });
}

startBot();
    
