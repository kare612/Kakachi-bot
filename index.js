import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay, 
    fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import axios from 'axios';

// إعدادات البوت الأساسية والمزخرفة
const DEVELOPER_NUMBER = "212784776925"; 
const BOT_NAME = "𝙆𝘼𝙆𝘼𝘾𝙃𝙄-𝘽𝙊𝙏";
const OWNER_NAME = "𝙆𝘼𝙆𝘼𝘾𝙃𝙄";
const PREFIX = ".";

// نظام نقاط بسيط مخزن في الذاكرة المؤقتة
const userPoints = {};

async function startBot() {
    if (!fs.existsSync('./session')) {
        fs.mkdirSync('./session');
    }

    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket.default ? makeWASocket.default({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, 
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    }) : makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, 
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        console.log(`\n=========================================`);
        console.log(`[ ℹ️ ] جاري طلب كود الربط للرقم: ${DEVELOPER_NUMBER}`);
        console.log(`=========================================\n`);
        await delay(5000); 
        try {
            let code = await sock.requestPairingCode(DEVELOPER_NUMBER);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(`\n┌────────────────────────────────────────┐`);
            console.log(`│ 🔑 كود الربط الخاص بك هو: ${code} │`);
            console.log(`└────────────────────────────────────────┘\n`);
        } catch (error) {
            console.error("❌ فشل في طلب كود الربط:", error);
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const errorOutput = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output;
            const statusCode = errorOutput ? errorOutput.statusCode : null;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log(`\n✨ =========================================`);
            console.log(`✅ تم اتصال [ ${BOT_NAME} ] بنجاح وهو جاهز تماماً للرد!`);
            console.log(`========================================= ✨\n`);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message || mek.key.fromMe) return;

            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];
            
            let body = "";
            if (type === 'conversation') body = mek.message.conversation;
            else if (type === 'extendedTextMessage') body = mek.message.extendedTextMessage.text;
            else if (type === 'imageMessage') body = mek.message.imageMessage.caption;
            else if (type === 'videoMessage') body = mek.message.videoMessage.caption;

            if (!body || !body.startsWith(PREFIX)) return;

            const args = body.trim().split(/ +/).slice(1);
            const command = body.slice(PREFIX.length).trim().split(/ +/).shift().toLowerCase();
            const sender = mek.key.participant || mek.key.remoteJid;
            const isOwner = sender.includes(DEVELOPER_NUMBER);

            if (!userPoints[sender]) userPoints[sender] = 0;
            userPoints[sender] += 1;

            const reply = async (text) => {
                await sock.sendMessage(from, { text: `╭━━〔 ${BOT_NAME} 〕━━╮\n\n${text}\n\n╰━━━━━━━━━━━━━━╯` }, { quoted: mek });
            };

            // تشغيل الأوامر والـ APIs مباشرة بدون وسيط ومجلدات
            switch (command) {
                case 'الاوامر':
                case 'menu':
                case 'help':
                    await reply(`🌟 𝙆𝘼𝙆𝘼𝘾𝙃𝙄 - 𝙈𝙀𝙉𝙐 𝙈𝙐𝙇𝙏𝙄-𝘽𝙊𝙏 🌟

👑 𝗠𝗢𝗗𝗘: ${isOwner ? '𝗠𝗮𝘀𝘁𝗲𝗿 (المطور)' : '𝗨𝘀𝗲𝗿 (مستخدم)'}
🔮 𝗣𝗥𝗘𝗙𝗜𝗫: [ ${PREFIX} ]

📥 *أقسام التحميل والـ AI:*
┌──────────────┐
│ 🤖 ${PREFIX}ذكاء [السؤال] - التحدث مع الذكاء الاصطناعي
│ 📹 ${PREFIX}فيديو [الرابط] - تحميل فيديو تيك توك/يوتيوب
│ 🎵 ${PREFIX}صوت [الرابط] - تحميل الأغاني والمقاطع
└──────────────┘

🎮 *نظام النقاط والألعاب:*
┌──────────────┐
│ 🎮 ${PREFIX}العاب - فتح قائمة التسلية والألعاب
│ 📊 ${PREFIX}نقاطي - عرض رصيدك من النقاط
│ 🎁 ${PREFIX}هدية - الحصول على نقاط مجانية
└──────────────┘

⚙️ *أوامر التحكم والمجموعات:*
┌──────────────┐
│ 🔒 ${PREFIX}قفل - قفل إرسال الرسائل بالمجموعة
│ 🔓 ${PREFIX}فتح - فتح إرسال الرسائل بالمجموعة
└──────────────┘

💡 _تم التطوير بواسطة: ${OWNER_NAME}_`);
                    break;

                case 'بينج':
                case 'ping':
                    await reply(`🚀 *جـااااري الفـحـص...*\n⏱️ البوت يعمل بأعلى كفاءة وسرعة استجابة هائلة!`);
                    break;

                case 'ذكاء':
                case 'gpt':
                    if (args.length < 1) return reply("❌ يرجى كتابة سؤالك بعد الأمر!");
                    await reply("🤖 *جاري التفكير وتوليد الرد...*");
                    try {
                        const res = await axios.get(`https://lolhuman.xyz{encodeURIComponent(args.join(" "))}`);
                        await reply(res.data?.result || "❌ الخادم لا يستجيب حالياً.");
                    } catch { reply("❌ حدث خطأ في خادم الذكاء الاصطناعي."); }
                    break;

                case 'فيديو':
                    if (args.length < 1) return reply("❌ يرجى وضع رابط الفيديو!");
                    await reply("⏳ *جاري معالجة الرابط وتحميل الفيديو عبر الـ API...*");
                    try {
                        const res = await axios.get(`https://lolhuman.xyz{encodeURIComponent(args)}`);
                        await sock.sendMessage(from, { video: { url: res.data.result.link }, caption: `✨ تم التحميل بواسطة ${BOT_NAME}` }, { quoted: mek });
                    } catch { reply("❌ حدث خطأ أثناء جلب الفيديو."); }
                    break;

                case 'العاب':
                    await reply(`🎮 *قائمة التسلية ونظام النقاط:*
                    
🪙 [ ${PREFIX}نقاطي ] - معرفة نقاطك الحالية
🎁 [ ${PREFIX}هدية ] - طلب هدية يومية من البوت`);
                    break;

                case 'نقاطي':
                    await reply(`🪙 رصيدك الحالي هو: *${userPoints[sender]}* نقطة.`);
                    break;

                case 'هدية':
                    const bonus = Math.floor(Math.random() * 50) + 10;
                    userPoints[sender] += bonus;
                    await reply(`🎁 مبروك! حصلت على *${bonus}* نقطة هدية مجانية.`);
                    break;

                case 'قفل':
                    if (!from.endsWith('@g.us')) return reply("❌ هذا الأمر للمجموعات فقط!");
                    await sock.groupSettingUpdate(from, 'announcement');
                    await reply("🔒 تم إغلاق المجموعة بنجاح.");
                    break;

                case 'فتح':
                    if (!from.endsWith('@g.us')) return reply("❌ هذا الأمر للمجموعات فقط!");
                    await sock.groupSettingUpdate(from, 'not_announcement');
                    await reply("🔓 تم فتح المجموعة بنجاح.");
                    break;

                default:
                    break;
            }
        } catch (err) {
            console.error(err);
        }
    });
}

startBot().catch(err => console.error(err));
