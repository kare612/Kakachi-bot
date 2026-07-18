const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
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
}

// تشغيل البوت
startBot();
