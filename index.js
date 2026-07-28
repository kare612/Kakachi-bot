import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay 
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';

// أرقام الهواتف المدخلة بصيغة الإدخال الدولية الصحيحة (بدون علامة +)
const botNumber = "212784776925"; 
const developerNumber = "212715469251@s.whatsapp.net";

async function startBot() {
    // إعداد حفظ جلسة الدخول في مجلد auth_info_baileys
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // تعطيل ظهور الـ QR في الطرفية
        logger: pino({ level: 'silent' }), // إخفاء سجلات الأخطاء المزعجة
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // طلب كود التحقق في حال عدم وجود جلسة نشطة مسبقاً
    if (!sock.authState.creds.registered) {
        console.log(`\n[!] يتم الآن طلب كود الربط للرقم: ${botNumber}...`);
        
        // تأخير بسيط للتأكد من اتصال السوكيت بالخوادم
        await delay(3000); 
        
        try {
            const pairingCode = await sock.requestPairingCode(botNumber);
            console.log(`\n===================================`);
            console.log(`[*] كود الربط الخاص بك هو: ${pairingCode}`);
            console.log(`===================================\n`);
        } catch (error) {
            console.error("[-] حدث خطأ أثناء طلب كود التحقق:", error);
        }
    }

    // الاستماع لحالة الاتصال
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut 
                : true;
            
            console.log('[-] تم قطع الاتصال. السبب:', lastDisconnect?.error, 'جاري إعادة الاتصال:', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('[+] تم تشغيل البوت والاتصال بنجاح على الواتساب!');
            
            // إرسال رسالة تأكيد للمطور فور نجاح الاتصال
            try {
                await sock.sendMessage(developerNumber, { 
                    text: `👋 مرحباً يا مطور! البوت نشط الآن ويعمل بنجاح عبر كود التحقق.` 
                });
            } catch (err) {
                console.error("[-] فشل إرسال رسالة التأكيد للمطور:", err);
            }
        }
    });

    // الاستماع للرسائل القادمة والرد التلقائي
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const messageText = msg.message.conversation || 
                                msg.message.extendedTextMessage?.text || '';

            // استجابة مخصصة إذا أرسل المطور كلمة "فحص" أو أي أمر مخصص
            if (from === developerNumber && messageText.toLowerCase() === 'فحص') {
                await sock.sendMessage(from, { text: '🚨 نظام البوت مستجيب ويعمل بدون مشاكل!' }, { quoted: msg });
            }
        } catch (err) {
            console.error("خطأ أثناء معالجة الرسالة المستلمة:", err);
        }
    });

    // حفظ بيانات الجلسة عند التحديث
    sock.ev.on('creds.update', saveCreds);
}

startBot();
