const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// إعدادات رقم مطور ومستلم البوت
const OWNER_NUMBER = "212784776925@s.whatsapp.net";
const phoneNumberToPair = "212784776925"; 

const commands = new Map();
const commandsFolder = path.join(__dirname, 'commands');

if (fs.existsSync(commandsFolder)) {
    const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsFolder, file));
        if (command.name) {
            commands.set(command.name, command);
            if (command.aliases && Array.isArray(command.aliases)) {
                command.aliases.forEach(alias => commands.set(alias, command));
            }
        }
    }
    console.log(`[ كاكاشي ] تم تحميل ${commandFiles.length} أمر من المجلد الخارجي.`);
}

async function startKakashiBot() {
    const { state, saveCreds } = await useMultiFileAuthState('kakashi_session');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, 
        logger: require('pino')({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"] 
    });

    if (!sock.authState.creds.registered) {
        await delay(3000); 
        try {
            console.log(`\n==================================================`);
            console.log(`📲 جاري طلب كود الربط للرقم: [ ${phoneNumberToPair} ] ...`);
            
            let code = await sock.requestPairingCode(phoneNumberToPair);
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            
            console.log(`\n🔥 كود ربط بوت كاكاشي الخاص بك هو: 👉  [ \x1b[32m${code}\x1b[0m ]  👈`);
            console.log(`==================================================\n`);
        } catch (error) {
            console.error("❌ فشل في جلب كود الربط:", error);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startKakashiBot();
        } else if (connection === 'open') {
            console.log('🚀 محرك بوت كاكاشي متصل عبر رقم الهاتف ويعمل الآن بنجاح 100%!');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages;
        if (!msg || !msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const cleanText = text.trim().toLowerCase();

        const sender = msg.key.participant || msg.key.remoteJid;
        const isOwner = sender.includes("212784776925");

        if (cleanText === 'السلام عليكم' || cleanText === 'سلام عليكم') {
            return await sock.sendMessage(from, { text: 'وعليكم السلام ورحمة الله وبركاته يا نينجا 🥷🏻 نورت!' }, { quoted: msg });
        }
        if (cleanText === 'كاكاشي') {
            return await sock.sendMessage(from, { text: 'نعم! أنا بوت كاكاشي في الخدمة ⚡ اكتب (.الاوامر) لترى قائمتي الفنية.' }, { quoted: msg });
        }
        if (cleanText === 'المطور' || cleanText === 'رقم المطور') {
            return await sock.sendMessage(from, { text: `👑 مطوري ومبرمجي هو القائد كاكاشي، وهذا هو رقمه المباشر:\nwa.me/212784776925` }, { quoted: msg });
        }

        const prefix = '.';
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (commandName === 'الاوامر' || commandName === 'أوامر' || commandName === 'help' || commandName === 'menu') {
            const menuText = `
✨ ━━━━━━ 🜲 *𝐊𝐀𝐊𝐀𝐒𝐇𝐈 𝐁𝐎𝐓* 🜲 ━━━━━━ ✨

🥷🏻 *مرحباً بك في قائمة أوامر بوت كاكاشي الشاملة!*
👤 *المطور:* @${OWNER_NUMBER.split('@')}
⚡ *البادئة الحالية:* [  *.*  ]

👑 ━━━ ❪ *🥷🏻 قـسـم الـمـطـور* ❫ ━━━ 👑
» \`.فحص\` ➪ لمعرفة سرعة استجابة المحرك.
» \`المطور\` ➪ جلب رابط المحادثة المباشر لصاحب البوت.

🎨 ━━━ ❪ *✍️ قـسـم الـزخـرفـة* ❫ ━━━ 🎨
» \`.زخرف\` [النص] ➪ زخرفة النصوص الإنجليزية والأرقام بـ 16 نمطاً مذهلاً دفعة واحدة.
» _مثال:_ \`.زخرف Kakashi\`

🎙️ ━━━ ❪ *🗣️ قـسـم الـنـطـق والـصـوت* ❫ ━━━ 🎙️
» \`.قول\` [الكلام] ➪ تحويل النص المكتوب إلى رسالة صوتية مسموعة داخل الشات.
» _مثال:_ \`.قول أهلاً بكم في عالم النينجا\`

🤖 ━━━ ❪ *⚙️ الـردود الـتـلـقـائـيـة* ❫ ━━━ 🤖
• البوت يتفاعل تلقائياً عند كتابة العبارات التالية (بدون نقطة):
➪ \`السلام عليكم\`
➪ \`كاكاشي\`
➪ \`المطور\`

✨ ━━━━━━━━━━━━━━━━━━━━━━━ ✨`;
            return await sock.sendMessage(from, { text: menuText, mentions: [OWNER_NUMBER] }, { quoted: msg });
        }

        if (commandName === 'فحص' || commandName === 'ping') {
            const startTime = Date.now();
            await sock.sendMessage(from, { text: '⚡ جاري فحص استجابة محرك كاكاشي...' }, { quoted: msg }).then(async () => {
                const responseTime = Date.now() - startTime;
                await sock.sendMessage(from, { text: `🚀 البوت شغال تمام!\n⏱️ سرعة الاستجابة: *${responseTime}ms*` }, { quoted: msg });
            });
            return;
        }

        const command = commands.get(commandName);
        if (command) {
            if (command.ownerOnly && !isOwner) {
                return await sock.sendMessage(from, { text: '❌ عذراً، هذا الأمر مخصص فقط لمطور البوت!' }, { quoted: msg });
            }
            try {
                await command.execute(sock, msg, args, { isOwner, OWNER_NUMBER });
            } catch (error) {
                console.error(error);
            }
        }
    });
}

startKakashiBot();
                                     
