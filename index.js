import makeWASocket, { useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import BidiJS from "bidi-js";

// تهيئة مكتبة إصلاح النصوص العربية
const bidi = BidiJS();
function fixArabicText(text) {
    return bidi.getReorderedText(text);
}

async function startBot() {
    // تحديد مجلد حفظ الجلسة (session)
    const { state, saveCreds } = await useMultiFileAuthState('session');

    const sock = makeWASocket.default({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false // إيقاف طباعة الـ QR
    });

    // الربط باستخدام كود التحقق (Pairing Code) في حال عدم وجود جلسة سابقة
    if (!sock.authState.creds.registered) {
        // رقم الهاتف المرسل: 212784776925
        const phoneNumber = "212784776925"; 
        
        await delay(3000); // انتظار قصير لضمان جاهزية الاتصال
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(`\n====================================`);
            console.log(` كود ربط الواتساب الخاص بك هو: \x1b[32m${code}\x1b[0m`);
            console.log(`====================================\n`);
        } catch (error) {
            console.error("فشل في طلب كود الربط:", error);
        }
    }

    // إدارة الأحداث والرسائل
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages;
            if (!msg.message || msg.key.fromMe) return;
        } catch (err) {
            console.error(err);
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log("تم إغلاق الاتصال، جاري إعادة التشغيل...");
            startBot();
        } else if (connection === 'open') {
            console.log("تم اتصال البوت بنجاح!");
        }
    });
}

startBot();
