const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// إعدادات البوت الرئيسية
const DEVELOPER_NUMBER = "212784776925@s.whatsapp.net"; // رقم المطور الخاص بك
const BOT_PREFIX = "."; // رمز تشغيل الأوامر (مثال: .اوامر)

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    // 1. توليد كود التحقق الرقمي تلقائياً للربط
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925"; 
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`[+] كود الربط الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.error("خطأ أثناء طلب كود الربط:", error);
            }
        }, 3000);
    }

    // 2. مستمع الرسائل، الأوامر، الجروبات، والـ APIs
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? msg.key.participant : from;
            
            // استخراج نص الرسالة
            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            if (!body.startsWith(BOT_PREFIX)) return; // يتجاهل الرسائل التي لا تبدأ بالرمز .

            const args = body.slice(BOT_PREFIX.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            const textArgs = args.join(" ");

            // جلب معلومات الجروب والتحكم بالرتب (النقابات/المشرفين)
            let groupMetadata = isGroup ? await sock.groupMetadata(from) : null;
            let groupAdmins = isGroup ? groupMetadata.participants.filter(v => v.admin !== null).map(v => v.id) : [];
            const isAdmin = groupAdmins.includes(sender);
            const isBotAdmin = groupAdmins.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net');
            const isDeveloper = sender === DEVELOPER_NUMBER;

            // ================= [ نظام الأوامر المزخرفة والـ APIs ] =================

            switch (command) {
                // أمر قائمة الأوامر المزخرفة
                case 'الاوامر':
                case 'أوامر':
                case 'menu':
                    const menuText = `
✨ ━━━━━━ 🌟 *كــاكــاشــي بــوت* 🌟 ━━━━━━ ✨
👑 *الـمـطـور:* @${DEVELOPER_NUMBER.split('@')[0]}
📡 *الـحـالـة:* مـتـصـل ⚡
📌 *الـرمـز:* [ ${BOT_PREFIX} ]
━━━━━━━━━━━━━━━━━━━━━━━━
📜 *﹝ أواﻣِـﺮ اﻟـﺠُـﺮوﺑـﺎت واﻟـﻨِّـﻘـﺎﺑـﺎت ﹞*
  » ${BOT_PREFIX}طرد (لمسح عضو)
  » ${BOT_PREFIX}رفع_ادمن (منح رتبة)
  » ${BOT_PREFIX}قفل (إغلاق الجات)

🎥 *﹝ أواﻣِـﺮ اﻟـﻤِـﻴـﺪﻳـﺎ واﻟـﺘَّـﻨـﺰﻳـﻼت ﹞*
  » ${BOT_PREFIX}فيديو [رابط اليوتيوب/تيك توك]
  » ${BOT_PREFIX}توليد [نص لتحويله لكود]
━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *تم التطوير بكل حب لـ كاكاشي بوت* 🌟`;
                    await sock.sendMessage(from, { text: menuText, mentions: [DEVELOPER_NUMBER] }, { quoted: msg });
                    break;

                // أمر تحكم المشرفين: طرد عضو
                case 'طرد':
                case 'kick':
                    if (!isGroup) return reply(sock, from, "❌ هذا الأمر يعمل داخل المجموعات فقط!", msg);
                    if (!isAdmin && !isDeveloper) return reply(sock, from, "❌ هذا الأمر خاص بالمشرفين والنقابة فقط!", msg);
                    if (!isBotAdmin) return reply(sock, from, "❌ يجب رفع البوت مشرف أولاً!", msg);
                    
                    let targetKick = msg.message.extendedTextMessage?.contextInfo?.mentionedJid[0] || args[0] + '@s.whatsapp.net';
                    await sock.groupParticipantsUpdate(from, [targetKick], "remove");
                    await reply(sock, from, "✅ تم طرد العضو بنجاح من المجموعة.", msg);
                    break;

                // أمر تشغيل الـ API وتحميل الفيديوهات
                case 'فيديو':
                case 'video':
                    if (!textArgs) return reply(sock, from, "❌ يرجى إدخال رابط الفيديو! مثال:\n.فيديو https://youtube.com...", msg);
                    await reply(sock, from, "⏳ جاري تحميل وفحص الفيديو عبر الـ API... انتظر قليلاً", msg);
                    
                    try {
                        // هنا يمكنك استبدال الرابط بـ API تحميل حقيقي خاص بك
                        const apiUrl = `https://screenshotlayer.com{encodeURIComponent(textArgs)}`; 
                        
                        await sock.sendMessage(from, { 
                            video: { url: apiUrl }, 
                            caption: "🎬 *تم التحميل بنجاح بواسطة كاكاشي بوت* ⚡" 
                        }, { quoted: msg });
                    } catch (e) {
                        await reply(sock, from, "❌ عذراً، فشل تحميل الفيديو من الـ API المحدد.", msg);
                    }
                    break;

                // أمر توليد الأكواد الرقمية أو الرموز النصية المزخرفة
                case 'توليد':
                    if (!textArgs) return reply(sock, from, "❌ اكتب النص الذي تريد توليد كود أو زخرفة له.", msg);
                    let decoratedText = textArgs.split('').map(char => char + '̶').join(''); // نموذج زخرفة برمجية بسيطة
                    let randomCode = Math.floor(100000 + Math.random() * 900000); // توليد كود عشوائي من 6 أرقام
                    
                    await reply(sock, from, `📝 *الزخرفة:* ${decoratedText}\n🔑 *الكود الرقمي المولد:* \`${randomCode}\``, msg);
                    break;
            }

        } catch (err) {
            console.error(err);
        }
    });

    // دالة مساعدة لإرسال الرد السريع
    async function reply(sock, from, text, msg) {
        await sock.sendMessage(from, { text: text }, { quoted: msg });
    }

    // إعادة الاتصال الذكي
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
    const { handleCommand } = require('./commands.js');

sock.ev.on('messages.upsert', async chatUpdate => {
    try {
        const msg = chatUpdate.messages[0]; // قراءة الرسالة الأولى المباشرة
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        // تشغيل المعالج الشامل فوراً
        await handleCommand(sock, from, msg, body);

    } catch (err) {
        console.error("خطأ في استقبال الرسالة:", err);
    }
});
    if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('[+] كاكاشي بوت متصل ويعمل بنظام النقابات والـ API!');
        }
    });
}

startBot();
                    
