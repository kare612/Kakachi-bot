cat << 'EOF' > index.js
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu('Chrome')
    });

    // طلب كود الربط الرقمي للرقم المعتمد إذا لم يتم التسجيل
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925";
        console.log('⏳ جاري تهيئة الاتصال والانتظار لطلب كود الربط...');
        await delay(10000);
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log('\n=========================================');
            console.log(`🔥 كود الربط الخاص بك هو: ${code}`);
            console.log('=========================================\n');
        } catch (error) {
            console.error('❌ خطأ في طلب الكود:', error.message);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    // استقبال ومعالجة الأوامر والمجموعات
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        // الحصول على نص الرسالة والمعرف (سواء رقم شخصي أو جروب)
        const from = msg.key.remoteJid;
        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const command = messageContent.trim().toLowerCase();

        // 1. أمر عرض قائمة الأوامر (المنيو)
        if (command === '.الاوامر' || command === 'الاوامر' || command === '.menu') {
            const menuText = `⚡ *قائمة أوامر بوت كاكاشي المطور* ⚡\n\n` +
                             `🤖 *الأوامر العامة:*\n` +
                             `• *.الاوامر* : لعرض هذه القائمة.\n` +
                             `• *فيديو1* : لإرسال مقطع فيديو تجريبي.\n` +
                             `• *فيديو2* : لإرسال فيديو مزخرف.\n` +
                             `• *رابط* : يعرض رابط المستودع.\n\n` +
                             `🛡 *أوامر الجروبات:*\n` +
                             `• *تفعيل* : لتشغيل نظام النقابة.\n` +
                             `• *طرد* : لإزالة الأعضاء المتفاعلين سلباً.`;
            
            await sock.sendMessage(from, { text: menuText }, { quoted: msg });
        }

        // 2. أمر إرسال فيديو 1
        if (command === 'فيديو1') {
            await sock.sendMessage(from, { text: '⏳ جاري إرسال الفيديو، انتظر ثوانٍ...' }, { quoted: msg });
            
            // تأكد من وضع ملف الفيديو باسم video.mp4 في نفس مجلد البوت داخل تيرموكس
            if (fs.existsSync('./video.mp4')) {
                await sock.sendMessage(from, { 
                    video: fs.readFileSync('./video.mp4'), 
                    caption: '🎬 ها هو الفيديو المطلبو الخاص بك!' 
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: '❌ خطأ: لم يتم العثور على ملف باسم video.mp4 داخل المجلد لتوجيهه.' }, { quoted: msg });
            }
        }

        // 3. أمر إرسال فيديو 2
        if (command === 'فيديو2') {
            if (fs.existsSync('./video2.mp4')) {
                await sock.sendMessage(from, { 
                    video: fs.readFileSync('./video2.mp4'), 
                    caption: '✨ فيديو مزخرف واحترافي!' 
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: '❌ خطأ: ملف video2.mp4 غير موجود.' }, { quoted: msg });
            }
        }

        // 4. أمر مخصص للرابط
        if (command === 'رابط') {
            await sock.sendMessage(from, { text: '🔗 مستودع البوت الرسمي: https://github.com' }, { quoted: msg });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🎉 تم اتصال البوت بنجاح ومستعد لتلقي أكثر من 1000 أمر!');
        }
    });
}

startBot();
EOF
