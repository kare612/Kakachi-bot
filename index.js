const { default: makeWASocket, useMultiFileAuthState, delay, jidNormalizedUser, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

async function startBot() {
    // 1. إنشاء مسار حفظ جلسة تسجيل الدخول
    const { state, saveCreds } = await useMultiFileAuthState('session_info');

    // 2. إعداد اتصال السوكيت بالواتساب مع إضافة تعريف متصفح لتفادي خطأ الاتصال 428
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, 
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"] // حل مشكلة الـ Connection Closed وحظر طلب الكود
    });

    // 3. طلب كود الربط الرقمي للرقم المخصص
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925"; // رقم هاتفك المعتمد بدون (+)
        
        await delay(5000); // زيادة المهلة لضمان استقرار السيرفر قبل الطلب
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log("\n=================================");
            console.log(`🔑 كود الربط الخاص بك هو: ${code}`);
            console.log("=================================\n");
        } catch (error) {
            console.error("❌ حدث خطأ أثناء طلب كود الربط:", error);
        }
    }

    // 4. حفظ بيانات الجلسة عند التحديث
    sock.ev.on('creds.update', saveCreds);

    // 5. مراقبة حالة الاتصال بالخادم ومعالجة مشاكل إعادة التشغيل الذكي
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ تم تشغيل البوت بنجاح واتصاله بالواتساب والرد متاح للجميع الآن!');
        } else if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🔄 تم إغلاق الاتصال بسبب:', lastDisconnect?.error, 'جاري إعادة الاتصال تلقائياً:', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        }
    });

    // 6. استقبال ومعالجة الأوامر من جميع المستخدمين
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return; // تجاهل الرسائل الفارغة
            if (mek.key.fromMe) return; // تجاهل رسائل البوت الموجهة لنفسه لمنع التكرار اللانهائي (Loop)

            // تحديد من أرسل الرسالة ومن أي شات (مجموعة أو خاص)
            const remoteJid = mek.key.remoteJid; 
            const sender = mek.key.participant || remoteJid;
            const botJid = jidNormalizedUser(sock.user.id);

            // استخراج النص من الرسالة بجميع أشكالها المتوقعة
            const messageType = Object.keys(mek.message)[0];
            const body = messageType === 'conversation' ? mek.message.conversation :
                         messageType === 'extendedTextMessage' ? mek.message.extendedTextMessage.text :
                         messageType === 'imageMessage' ? mek.message.imageMessage.caption :
                         messageType === 'videoMessage' ? mek.message.videoMessage.caption : '';

            if (!body) return; // إذا لم تكن رسالة نصية يتم التجاهل

            const command = body.trim().toLowerCase(); // تنظيف النص من الفراغات وتحويله للأحرف الصغيرة

            // نظام الأوامر المتعددة
            switch (command) {
                case 'الاوامر':
                case 'أوامر':
                case 'menu':
                    const menuText = `*قائمة الأوامر الخاصة بك:* 🤖\n\n` +
                                     `• *فحص* : للاطمئنان على حالة الاتصال.\n` +
                                     `• *رابطي* : لعرض رابط حسابك.\n` +
                                     `• *المطور* : معلومات المطور الرئيسي للبوت.\n` +
                                     `• *الملف* : معلومات برمجية سريعة.`;
                    await sock.sendMessage(remoteJid, { text: menuText }, { quoted: mek });
                    break;

                case 'فحص':
                    await sock.sendMessage(remoteJid, { text: "⚡ البوت يعمل بنشاط واستجابة فائقة السرعة وللجميع!" }, { quoted: mek });
                    break;

                case 'رابطي':
                    const userPhone = jidNormalizedUser(sender).split('@')[0];
                    await sock.sendMessage(remoteJid, { text: `رقم حسابك الحالي هو: wa.me/${userPhone}` }, { quoted: mek });
                    break;

                case 'المطور':
                    await sock.sendMessage(remoteJid, { text: `👑 المطور الرئيسي للبوت:\nرقم المطور: wa.me/212784776925\nحساب الجيت هاب: Kare612` }, { quoted: mek });
                    break;

                case 'الملف':
                    await sock.sendMessage(remoteJid, { text: "📂 هذا البوت يعمل باستخدام مكتبة Baileys وسيقوم بتنفيذ جميع أوامر المستخدمين بنجاح." }, { quoted: mek });
                    break;

                default:
                    // تم تركه فارغاً لتجنب إرسال رسائل عشوائية للمستخدمين في المجموعات عند كتابة أي نص عادي
                    break;
            }
        } catch (error) {
            console.error("❌ خطأ أثناء تشغيل معالج الأوامر الاستجابي:", error);
        }
    });
}

// تشغيل البوت
startBot();
               
