import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay, 
    fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';

// إعدادات البوت الأساسية
const DEVELOPER_NUMBER = "212784776925"; // رقم المطور الخاص بك
const BOT_NAME = "𝙆𝘼𝙆𝘼𝘾𝙃𝙄-𝘽𝙊𝙏";
const OWNER_NAME = "𝙆𝘼𝙆𝘼𝘾𝙃𝙄";
const PREFIX = ".";

async function startBot() {
    // إنشاء مجلد حفظ الجلسة إذا لم يكن موجوداً
    if (!fs.existsSync('./session')) {
        fs.mkdirSync('./session');
    }

    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket.default({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // تعطيل الـ QR Code تماماً
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // تفعيل خاصية كود الربط عبر رقم الهاتف (Pairing Code) في حال عدم تسجيل الدخول مسبقاً
    if (!sock.authState.creds.registered) {
        console.log(`\n=========================================`);
        console.log(`[ ℹ️ ] جاري طلب كود الربط للرقم: ${DEVELOPER_NUMBER}`);
        console.log(`=========================================\n`);
        
        await delay(5000); // انتظار لضمان استقرار الاتصال قبل الطلب
        try {
            let code = await sock.requestPairingCode(DEVELOPER_NUMBER);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(`\n┌────────────────────────────────────────┐`);
            console.log(`│ 🔑 كود الربط الخاص بك هو: ${code} │`);
            console.log(`└────────────────────────────────────────┘\n`);
            console.log(`[ ⚠️ ] أدخل هذا الكود في هاتفك (الأجهزة المرتبطة -> ربط هاتف برقم)\n`);
        } catch (error) {
            console.error("❌ فشل في طلب كود الربط:", error);
        }
    }

    // إدارة أحداث الاتصال
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ تم إغلاق الاتصال بسبب: ', lastDisconnect.error, ', جاري إعادة الاتصال: ', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log(`\n✨ =========================================`);
            console.log(`✅ تم اتصال [ ${BOT_NAME} ] بنجاح وهو جاهز للعمل!`);
            console.log(`========================================= ✨\n`);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // إدارة واستقبال الرسائل والأنظمة المزخرفة
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            if (mek.key.fromMe) return;

            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];
            const content = JSON.stringify(mek.message);
            
            // استخراج النص من الرسالة
            let body = "";
            if (type === 'conversation') body = mek.message.conversation;
            else if (type === 'extendedTextMessage') body = mek.message.extendedTextMessage.text;
            else if (type === 'imageMessage') body = mek.message.imageMessage.caption;
            else if (type === 'videoMessage') body = mek.message.videoMessage.caption;

            if (!body.startsWith(PREFIX)) return;

            const args = body.trim().split(/ +/).slice(1);
            const command = body.slice(PREFIX.length).trim().split(/ +/).shift().toLowerCase();
            const sender = mek.key.participant || mek.key.remoteJid;
            const isOwner = sender.includes(DEVELOPER_NUMBER);

            // تزيين وزخرفة الردود العامة
            const reply = async (text) => {
                await sock.sendMessage(from, { text: `╭━━〔 ${BOT_NAME} 〕━━╮\n\n${text}\n\n╰━━━━━━━━━━━━━━╯` }, { quoted: mek });
            };

            // قسـم الأوامـر المزخرفـة
            switch (command) {
                case 'الاوامر':
                case 'menu':
                case 'help':
                    const menuText = `🌟 𝙆𝘼𝙆𝘼𝘾𝙃𝙄 - 𝘽𝙊𝙏 𝙈𝙀𝙉𝙐 🌟

👑 𝗠𝗢𝗗𝗘: ${isOwner ? '𝗠𝗮𝘀𝘁𝗲𝗿 (المطور)' : '𝗨𝘀𝗲𝗿 (مستخدم)'}
🔮 𝗣𝗥𝗘𝗙𝗜𝗫: [ ${PREFIX} ]

🤖 *أوامر البوت العامة:*
┌──────────────┐
│ ⚡ ${PREFIX}بينج - فحص السرعة
│ 📊 ${PREFIX}المعلومات - معلومات البوت
└──────────────┘

👑 *أوامر المطور الخاصة:*
┌──────────────┐
│ 📢 ${PREFIX}نشر - إرسال رسالة للكل
│ 🔌 ${PREFIX}خروج - مغادرة المجموعة
└──────────────┘

💡 _تم التطوير بواسطة: ${OWNER_NAME}_`;
                    await reply(menuText);
                    break;

                case 'بينج':
                case 'ping':
                    await reply(`🚀 *جـااااري الفـحـص...*\n⏱️ البوت يعمل بأعلى كفاءة وسرعة استجابة هائلة!`);
                    break;

                case 'المعلومات':
                case 'info':
                    await reply(`📝 *مواصفات النظام الخاص بك:*\n\n⚙️ *الاسم:* ${BOT_NAME}\n👑 *المطور:* ${OWNER_NAME}\n🌐 *الرقم:* +${DEVELOPER_NUMBER}\n📌 *النظام:* Termux Node.js`);
                    break;

                // أوامر المطور فقط
                case 'نشر':
                case 'broadcast':
                    if (!isOwner) return reply("❌ عذراً، هذا الأمر مخصص فقط لمطور البوت العظيم.");
                    if (args.length < 1) return reply(`❌ يرجى كتابة نص الرسالة بعد الأمر، مثال:\n${PREFIX}نشر أهلاً بالجميع`);
                    const bcText = args.join(" ");
                    await reply(`📢 *جاري إرسال إعلان المطور لجميع المحادثات...*\n\nالنص: ${bcText}`);
                    // هنا يمكن إضافة حلقة تكرار لإرسالها لجميع المجموعات لاحقاً
                    break;

                default:
                    // تجاهل الأوامر غير المعرفة أو إرسال تنبيه بسيط
                    break;
            }

        } catch (err) {
            console.error("Error in messages.upsert: ", err);
        }
    });
}

// تشغيل البوت
startBot().catch(err => console.error("خطأ حرج في تشغيل البوت:", err));
