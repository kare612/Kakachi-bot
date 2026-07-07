const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false // قم بإلغاء طباعة الـ QR
    });

    // تحقق مما إذا كان البوت غير مسجل مسبقاً ومستعد لطلب كود التحقق
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925"; // رقم الهاتف الخاص بك
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n============== CODE ==============`);
                console.log(`كود الربط الخاص بك هو: ${code}`);
                console.log(`==================================\n`);
            } catch (error) {
                console.error("فشل في طلب كود التحقق:", error);
            }
        }, 3000); // تأخير بسيط لضمان جاهزية الاتصال
    }

    sock.ev.on('creds.update', saveCreds);
}

startBot();
