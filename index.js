const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// رقم المطور الخاص بك (صاحب البوت)
const OWNER_NUMBER = "212784776925@s.whatsapp.net";

// تحميل الأوامر تلقائياً من مجلد commands
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
        printQRInTerminal: true,
        logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('تم إغلاق الاتصال. إعادة الاتصال: ', shouldReconnect);
            if (shouldReconnect) startKakashiBot();
        } else if (connection === 'open') {
            console.log('🚀 محرك بوت كاكاشي يعمل بأعلى كفاءة الآن ومستعد لتلقي الأوامر!');
        }
    });

    // الترحيب التلقائي بالأعضاء الجدد في المجموعات
    sock.ev.on('group-participants.update', async (anu) => {
        try {
            const metadata = await sock.groupMetadata(anu.id);
            const participants = anu.participants;
            for (let num of participants) {
                if (anu.action == 'add') {
                    const welcomeText = `✨ *مرحباً بك في المجموعة!* \n\n👤 أهلاً يا @${num.split('@')}\n🏡 نورت مجموعة: *${metadata.subject}*\n\n🥷🏻 أنا بوت *كاكاشي*، اكتب (.الاوامر) لترى ما يمكنني فعله!`;
                    await sock.sendMessage(anu.id, { 
                        text: welcomeText, 
                        mentions: [num] 
                    });
                }
            }
        } catch (err) {
            console.log("خطأ في نظام الترحيب التلقائي:", err);
        }
    });

    // إدارة واستقبال الرسائل والأوامر المدمجة
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages;
        if (!msg || !msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const cleanText = text.trim().toLowerCase();

        // معرفة الشخص المرسل وحالته
        const sender = msg.key.participant || msg.key.remoteJid;
        const isOwner = sender.includes("212784776925");

        // الردود التلقائية الذكية (بدون بادئة)
        if (cleanText === 'السلام عليكم' || cleanText === 'سلام عليكم') {
            return await sock.sendMessage(from, { text: 'وعليكم السلام ورحمة الله وبركاته يا نينجا 🥷🏻 نورت!' }, { quoted: msg });
        }
        if (cleanText === 'كاكاشي') {
            return await sock.sendMessage(from, { text: 'نعم! أنا بوت كاكاشي في الخدمة ⚡ اكتب (.الاوامر) لترى قائمتي الفنية.' }, { quoted: msg });
        }
        if (cleanText === 'المطور' || cleanText === 'رقم المطور') {
            return await sock.sendMessage(from, { text: `👑 مطوري ومبرمجي هو القائد كاكاشي، وهذا هو رقمه المباشر:\nwa.me/212784776925` }, { quoted: msg });
        }

        // إعداد البادئة للأوامر الفردية (.)
        const prefix = '.';
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // [ ميزة جديدة ]: أمر قائمة الأوامر الفنية والمقسمة بشكل جميل
        if (commandName === 'الاوامر' || commandName === 'أوامر' || commandName === 'help' || commandName === 'menu') {
            const menuText = `
✨ ━━━━━━ 🜲 *𝐊𝐀𝐊𝐀𝐒𝐇𝐈 𝐁𝐎𝐓* 🜲 ━━━━━━ ✨

🥷🏻 *مرحباً بك في قائمة أوامر بوت كاكاشي الشاملة!*
👤 *المطور:* @${OWNER_NUMBER.split('@')[0]}
⚡ *البادئة الحالية:* [  *${prefix}*  ]

👑 ━━━ ❪ *🥷🏻 قـسـم الـمـطـور* ❫ ━━━ 👑
» \`${prefix}فحص\` ➪ لمعرفة سرعة استجابة المحرك.
» \`المطور\` ➪ جلب رابط المحادثة المباشر لصاحب البوت.

🎨 ━━━ ❪ *✍️ قـسـم الـزخـرفـة* ❫ ━━━ 🎨
» \`${prefix}زخرف\` [النص] ➪ زخرفة النصوص الإنجليزية والأرقام بـ 16 نمطاً مذهلاً دفعة واحدة.
» _مثال:_ \`${prefix}زخرف Kakashi\`

🎙️ ━━━ ❪ *🗣️ قـسـم الـنـطـق والـصـوت* ❫ ━━━ 🎙️
» \`${prefix}قول\` [الكلام] ➪ تحويل النص المكتوب إلى رسالة صوتية مسموعة داخل الشات.
» _مثال:_ \`${prefix}قول أهلاً بكم في عالم النينجا\`

🤖 ━━━ ❪ *⚙️ الـردود الـتـلـقـائـيـة* ❫ ━━━ 🤖
• البوت يتفاعل تلقائياً عند كتابة العبارات التالية (بدون نقطة):
➪ \`السلام عليكم\`
➪ \`كاكاشي\`
➪ \`المطور\`

✨ ━━━━━━━━━━━━━━━━━━━━━━━ ✨
💡 *ملاحظة:* تأكد من كتابة النقطة (*.*) قبل الأوامر الفرعية لكي يعمل معك المحرك بنجاح.
`;
            return await sock.sendMessage(from, { 
                text: menuText,
                mentions: [OWNER_NUMBER]
            }, { quoted: msg });
        }

        // أمر فحص السرعة والحالة (Ping) المدمج
        if (commandName === 'فحص' || commandName === 'ping') {
            const startTime = Date.now();
            await sock.sendMessage(from, { text: '⚡ جاري فحص استجابة محرك كاكاشي...' }, { quoted: msg }).then(async (sentMsg) => {
                const responseTime = Date.now() - startTime;
                await sock.sendMessage(from, { text: `🚀 البوت شغال تمام!\n⏱️ سرعة الاستجابة: *${responseTime}ms*` }, { quoted: msg });
            });
            return;
        }

        // تشغيل الأوامر الخارجيّة من المجلد
        const command = commands.get(commandName);
        if (command) {
            if (command.ownerOnly && !isOwner) {
                return await sock.sendMessage(from, { text: '❌ عذراً، هذا الأمر مخصص فقط لمطور البوت!' }, { quoted: msg });
            }

            try {
                await command.execute(sock, msg, args, { isOwner, OWNER_NUMBER });
            } catch (error) {
                console.error(`خطأ في تشغيل أمر المجلد الخارجي ${commandName}:`, error);
                await sock.sendMessage(from, { text: '❌ حدث خطأ داخلي أثناء معالجة الأمر الخارجي.' });
            }
        }
    });
}

startKakashiBot();
        
