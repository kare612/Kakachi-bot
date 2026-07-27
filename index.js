import baileys from "@whiskeysockets/baileys";
import readline from "readline";

const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    DisconnectReason 
} = baileys;

const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout 
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    // تحديد مجلد حفظ جلسة تسجيل الدخول
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // إيقاف الـ QR لاستخدام كود التحقق
        logger: pino({ level: 'silent' })
    });

    // طلب كود الربط إذا لم يكن مسجلاً للدخول مسبقاً
    if (!sock.authState.creds.registered) {
        let phoneNumber = "212784776925";
        await delay(3000); // الانتظار قليلاً لتهيئة الاتصال
        let code = await sock.requestPairingCode(phoneNumber);
        console.log(`\n======================================`);
        console.log(`[*] كود ربط الواتساب الخاص بك هو: ${code}`);
        console.log(`======================================\n`);
    }

    // إدارة أحداث الاتصال
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('تم إغلاق الاتصال، جاري إعادة الاتصال...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('تم اتصال البوت بنجاح ومراقبة الرسائل الممتدة!');
        }
    });

    // حفظ بيانات الجلسة عند التحديث
    sock.ev.on('creds.update', saveCreds);

    // استقبال الرسائل وإعادة توجيهها للقناة
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        // الحصول على نص الرسالة القادمة
        const messageText = msg.message.conversation || 
                            msg.message.extendedTextMessage?.text || "";

        // معرف قناة الواتساب المستهدفة المستخرج من الرابط الخاص بك
        const channelJid = "120363385750242137@newsletter"; 

        if (messageText) {
            console.log(`[رسالة جديدة]: ${messageText}`);
            
            // إرسال الكود أو الرسالة المستلمة مباشرة إلى قناتك
            await sock.sendMessage(channelJid, { 
                text: `📢 كود مستلم جديد:\n\n${messageText}` 
            });
        }
    });
}

startBot();
