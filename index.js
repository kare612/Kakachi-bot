const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');

// الإعدادات الثابتة للبوت
global.developer = "212784776925"; 
global.prefix = "."; 
global.ninjaDatabase = global.ninjaDatabase || {};

async function startBot() {
    // استخدام مجلد جديد كلياً لتفادي تداخل الكاش القديم
    const { state, saveCreds } = await useMultiFileAuthState('session_auth_clean');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'), // محرك كروم مستقر جداً
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000
    });

    sock.ev.on('creds.update', saveCreds);

    // طلب كود واحد فقط نظيف وجديد تماماً
    if (!sock.authState.creds.registered) {
        console.log("----------------------------------------");
        console.log("⏳ Requesting a FRESH and SINGLE pairing code...");
        console.log("----------------------------------------");
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(String(global.developer));
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`[+] كود الربط النظيف والوحيد هو: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.log("❌ خوادم واتساب فرضت حظراً مؤقتاً بسبب كثرة الأكواد. يرجى الانتظار 3 دقائق ثم المحاولة مجدداً.");
            }
        }, 10000); // انتظام 10 ثوانٍ لتهيئة الاتصال بشكل كامل ومستقر أولاً
    }

    // معالج الرسائل والأوامر والردود الشاملة والتحكم
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

            if (body.includes('مطور') || body.includes('المطور')) {
                return sock.sendMessage(from, { text: `👑 *﹝ قِـسْـمِ إِدَارَة كَـاكَـاشِـي بُـوت ﹞*\n\n👋 للتواصل المباشر مع المطور:\n🔗 https://wa.me` }, { quoted: msg });
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
                    const menuText = `🎨 ━━━━━━ 👑 *كــاكــاشــي الــمُــطَــوَّر* 👑 ━━━━━━ 🎨
👑 *الـمـطـور:* @${global.developer}
📌 *الـرمـز الـمـعتـمـد:* [ ${global.prefix} ]
━━━━━━━━━━━━━━━━━━━━━━━━
  » ${global.prefix}شخصيتي (ملف الحساب والذهب)
  » ${global.prefix}تدريب (لرفع طاقة الشينوبي)
  » ${global.prefix}قفل (إغلاق الجات للنخبة فقط)
  » ${global.prefix}فتح (فتح الجات لعامة الأعضاء)
━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *تم تفعيل نظام الكود الموحد والنظيف* 🌟`;
                    await sock.sendMessage(from, { text: menuText, mentions: [global.developer + '@s.whatsapp.net'] }, { quoted: msg });
                    break;

                case 'شخصيتي':
                    await sock.sendMessage(from, { text: `🥷 *﹝ مَـلَـف الـشِّـيـنُـوبِـي الأُسْـطُـورِي ﹞*\n\n📊 *المستوى:* [ ${profile.level} ]\n⚔️ *القوة:* [ 🛡️ ${profile.power} ]\n💰 *الذهب:* [ 🪙 ${profile.gold} ]` }, { quoted: msg });
                    break;

                case 'تدريب':
                    profile.gold += 30;
                    profile.power += 5;
                    await sock.sendMessage(from, { text: `🎯 خضت تدريباً وحصلت على الذهب والقوة بنجاح!` }, { quoted: msg });
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
        
