import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';

const phoneNumber = "212784776925";
const pluginsFolder = './ايضافة'; // مجلد الإضافات والأوامر الخاص بك
const commands = new Map(); // خريطة لحفظ الأوامر المقروءة ديناميكياً

// دالة تفقد وقراءة جميع ملفات الأوامر داخل مجلد "ايضافة" تلقائياً
async function loadPlugins() {
    if (!fs.existsSync(pluginsFolder)) {
        fs.mkdirSync(pluginsFolder);
    }
    
    const files = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js'));
    console.log(`\n📂 جاري فحص مجلد [ايضافة]... تم العثور على (${files.length}) ملفات أوامر.`);
    
    for (const file of files) {
        try {
            const filePath = path.join(pluginsFolder, file);
            // جلب الملف برمجياً باستخدام الـ Dynamic Import للموديلز
            const plugin = await import(`./${filePath.replace(/\\/g, '/')}`);
            
            if (plugin.default && plugin.default.command) {
                // تسجيل كل كلمة مفتاحية موجودة بمصفوفة الـ command لترتبط بالدالة الافتراضية
                plugin.default.command.forEach(cmd => {
                    commands.set(cmd, plugin.default);
                });
                console.log(` ✅ تم تحميل الإضافة بنجاح من الملف: [${file}]`);
            }
        } catch (error) {
            console.error(` ❌ فشل تحميل الملف [${file}]:`, error);
        }
    }
}

async function startKakashiBot() {
    // تحميل وقراءة الإضافات قبل بدء تشغيل سكايب الواتساب
    await loadPlugins();

    const { state, saveCreds } = await useMultiFileAuthState('./kakashi_session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, 
        logger: pino({ level: 'silent' }), 
        browser: ["Ubuntu", "Chrome", "20.0.04"], 
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                console.log(`\n⏳ جاري طلب كود الربط الرقمي للرقم: ${phoneNumber}...`);
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                
                console.log('\n==================================================');
                console.log(`🔑 كود ربط بوت كاكاشي الخاص بك هو: 【 ${code} 】`);
                console.log('==================================================');
            } catch (error) {
                console.error('❌ حدث خطأ أثناء طلب كود الربط:', error);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut 
                : true;
            if (shouldReconnect) startKakashiBot();
        } else if (connection === 'open') {
            console.log('\n🚀 تم الاتصال بنجاح! مجلد [ايضافة] جاهز لاستقبال وتنفيذ أوامرك الحية ✅');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const messageType = Object.keys(msg.message)[0];
            let text = '';
            if (messageType === 'conversation') {
                text = msg.message.conversation;
            } else if (messageType === 'extendedTextMessage') {
                text = msg.message.extendedTextMessage.text;
            }

            const cleanText = text.trim();

            if (cleanText === '.ping') {
                await sock.sendMessage(msg.key.remoteJid, { text: 'pong! 🤖 نظام الاستدعاء التلقائي يعمل بكفاءة.' }, { quoted: msg });
                return;
            }

            // الفحص والتشغيل الذكي من الخريطة الديناميكية للأوامر
            if (cleanText.startsWith('.')) {
                const parts = cleanText.slice(1).split(' ');
                const commandName = parts[0]; // الأمر المدخل (مثل: الاوامر)
                const args = parts.slice(1);

                // التحقق الفوري إذا كان الأمر مسجلاً داخل خريطة الإضافات المجلوبة
                if (commands.has(commandName)) {
                    const activePlugin = commands.get(commandName);
                    // تنفيذ الدالة المقترنة بالأمر تلقائياً
                    await activePlugin.default({ sock, msg, args });
                }
            }
        } catch (err) {
            console.error('خطأ في معالجة الرسالة الواردة:', err);
        }
    });
}

startKakashiBot();
            
