const { default: makeWASocket, useMultiFileAuthState, delay, jidNormalizedUser } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

async function startBot() {
    // 1. إنشاء مسار حفظ جلسة تسجيل الدخول
    const { state, saveCreds } = await useMultiFileAuthState('session_info');

    // 2. إعداد اتصال السوكيت بالواتساب وإلغاء الـ QR
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // تم الإيقاف لعدم تداخل كود الـ QR
        logger: pino({ level: 'silent' })
    });

    // 3. طلب كود الربط الرقمي للرقم المخصص
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925"; // رقم هاتفك المعتمد بدون (+)
        
        await delay(3000); // مهلة قصيرة لضمان استقرار الاتصال قبل الطلب
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

    // 5. مراقبة حالة الاتصال بالخادم
    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('✅ تم تشغيل البوت بنجاح واتصاله بالواتساب!');
        } else if (connection === 'close') {
            console.log('🔄 تم إغلاق الاتصال، يتم إعادة التشغيل الآن...');
            startBot();
        }
    });

    // 6. استقبال معالجة الأوامر من نفس الرقم
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return; // تجاهل إذا لم تكن رسالة تحتوي على محتوى

            // الحصول على رقم البوت الحالي المسجل به الدخول لنفس الجلسة
            const botJid = jidNormalizedUser(sock.user.id);
            
            // تحديد من أرسل الرسالة
            const sender = mek.key.participant || mek.key.remoteJid;

            // التحقق الصارم: الرد فقط إذا كان مرسل الرسالة هو البوت نفسه
            if (jidNormalizedUser(sender) === botJid) {
                
                // استخراج النص من الرسالة بجميع أشكالها المتوقعة
                const messageType = Object.keys(mek.message)[0];
                const body = messageType === 'conversation' ? mek.message.conversation :
                             messageType === 'extendedTextMessage' ? mek.message.extendedTextMessage.text :
                             messageType === 'imageMessage' ? mek.message.imageMessage.caption :
                             messageType === 'videoMessage' ? mek.message.videoMessage.caption : '';

                if (!body) return; // إذا لم تكن رسالة نصية أو شرح لوسيطة، يتم التجاهل

                const remoteJid = mek.key.remoteJid; // تحديد الروم أو الخاص المستهدف للرد
                const command = body.trim().toLowerCase(); // تنظيف النص من الفراغات لضمان دقة التعرف

                // نظام الأوامر المتعددة (يمكنك إضافة آلاف الأوامر هنا بسهولة)
                switch (command) {
                    case 'الاوامر':
                    case 'أوامر':
                    case 'menu':
                        const menuText = `*قائمة الأوامر الخاصة بك:* 🤖\n\n` +
                                         `• *فحص* : للاطمئنان على حالة الاتصال.\n` +
                                         `• *رابطي* : لعرض رقمك الشخصي.\n` +
                                         `• *الملف* : معلومات برمجية سريعة.`;
                        await sock.sendMessage(remoteJid, { text: menuText }, { quoted: mek });
                        break;

                    case 'فحص':
                        await sock.sendMessage(remoteJid, { text: "⚡ البوت يعمل بنشاط واستجابة فائقة السرعة!" }, { quoted: mek });
                        break;

                    case 'رابطي':
                        await sock.sendMessage(remoteJid, { text: `رقم حسابك الحالي هو: wa.me/${botJid.split('@')[0]}` }, { quoted: mek });
                        break;

                    case 'الملف':
                        await sock.sendMessage(remoteJid, { text: "📂 هذا البوت يعمل باستخدام مكتبة Baileys وسيقوم بتنفيذ أوامرك الحصرية فقط." }, { quoted: mek });
                        break;

                    // 💡 هنا يمكنك إضافة أي أمر جديد بنفس الطريقة تماماً:
                    /*
                    case 'اسم_الأمر':
                        await sock.sendMessage(remoteJid, { text: "الرد هنا" }, { quoted: mek });
                        break;
                    */

                    default:
                        // يمكنك تفعيل هذا السطر إذا كنت تريد رد تلقائي عند كتابة أي شيء آخر غير الأوامر
                        // await sock.sendMessage(remoteJid, { text: "عذراً، هذا الأمر غير مدرج بالقائمة الحالية المحفوظة لديك." }, { quoted: mek });
                        break;
                }
            }
        } catch (error) {
            console.error("❌ خطأ أثناء تشغيل معالج الأوامر الاستجابي:", error);
        }
    });
}

// تشغيل البوت
startBot();
            
