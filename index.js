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
const pluginsFolder = './ايضافة'; 
const commands = new Map(); 

async function loadPlugins() {
    if (!fs.existsSync(pluginsFolder)) {
        fs.mkdirSync(pluginsFolder);
    }
    
    // تنظيف الخريطة قبل إعادة التحميل لمنع التكرار
    commands.clear();
    const files = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js'));
    console.log(`\n📂 جاري فحص مجلد [ايضافة]... تم العثور على (${files.length}) ملفات أوامر.`);
    
    for (const file of files) {
        try {
            const filePath = path.join(pluginsFolder, file);
            const plugin = await import(`./${filePath.replace(/\\/g, '/')}?update=${Date.now()}`);
            
            if (plugin.default && plugin.default.command) {
                plugin.default.command.forEach(cmd => {
                    commands.set(cmd.trim(), plugin.default);
                });
                console.log(` ✅ تم تحميل الإضافة بنجاح من الملف: [${file}]`);
            }
        } catch (error) {
            console.error(` ❌ فشل تحميل الملف [${file}]:`, error);
        }
    }
}

async function startKakashiBot() {
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
            console.log('\n🚀 تم الاتصال بنجاح وبوت كاكاشي مستقر تماماً الآن! ✅');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0]; // قراءة الرسالة الأولى مباشرة وبدقة
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

            if (cleanText.startsWith('.')) {
                const parts = cleanText.slice(1).split(' ');
                const commandName = parts[0].trim(); // استخراج الكلمة الأولى كأمر نصي فقط
                const args = parts.slice(1);

                // مقارنة نصية صحيحة 100% مع خريطة المفاتيح المسجلة
                if (commands.has(commandName)) {
                    const activePlugin = commands.get(commandName);
                    await activePlugin.default({ sock, msg, args });
                }
            }
        } catch (err) {
            console.error('خطأ في معالجة الرسالة الواردة:', err);
        }
    });
}

startKakashiBot();
        
