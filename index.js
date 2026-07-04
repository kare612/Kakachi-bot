const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

async function startBot() {
    // تحديد مجلد حفظ جلسة الاتصال (الكريدز)
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false // تعطيل الـ QR ليعمل كود التحقق الرقمي
    });

    // حفظ التحديثات الخاصة بالاعتماديات تلقائياً
    sock.ev.on('creds.update', saveCreds);

    // التحقق من طلب رمز التحقق الرقمي (Pairing Code)
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925"; // رقم هاتفك
        
        setTimeout(async () => {
            try {
                // استدعاء الـ API الداخلي للمكتبة لتوليد كود الربط
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`[+] كود الربط الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.error("خطأ أثناء طلب كود الربط:", error);
            }
        }, 3000); // انتظام الانتظار 3 ثوانٍ قبل الطلب
    }

    // هنا يمكنك إضافة مستمع الرسائل والأوامر لاحقاً
    sock.ev.on('messages.upsert', async chatUpdate => {
        // إدارة الأوامر والردود تلقائياً
    });
}

startBot();
