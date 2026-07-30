import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = new Map();
const aliases = new Map();
const pluginsFolder = path.join(__dirname, 'plugins');

async function loadPlugins() {
    if (!fs.existsSync(pluginsFolder)) {
        console.log("⚠️ مجلد الإضافات plugins غير موجود!");
        return;
    }
    const files = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js'));
    for (const file of files) {
        try {
            const pluginModule = await import(`./plugins/${file}`);
            const plugin = pluginModule.default;
            if (plugin && plugin.name) {
                commands.set(plugin.name, plugin);
                if (plugin.alias && Array.isArray(plugin.alias)) {
                    for (const aliasName of plugin.alias) {
                        aliases.set(aliasName, plugin);
                    }
                }
                console.log(`✅ تم تحميل ملف الإضافة بنجاح: ${plugin.name}`);
            }
        } catch (error) {
            console.error(`❌ خطأ في تحميل ملف الإضافة ${file}:`, error);
        }
    }
}

async function startBot() {
    await loadPlugins();
    const { state, saveCreds } = await useMultiFileAuthState('session');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, 
        logger: pino({ level: 'silent' }),
        browser: ["Mac OS", "Safari", "17.4"] 
    });

    // 1. طلب كود الربط هنا (خارج حدث الاتصال) لضمان عدم التكرار أو التداخل
    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925";
        
        // مهلة 3 ثوانٍ للتأكد من تهيئة السوكيت بالكامل قبل طلب الكود
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n🔑 [ كود الربط الرقمي الجديد ]: ${code}\n`);
            } catch (err) {
                console.error("❌ فشل توليد كود الربط الرقمي:", err);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('🔄 جاري إعادة الاتصال...');
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🚀 تم تشغيل بوت كاكاشي بنجاح والاتصال بالواتساب مستقر الآن!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg || !msg.message || msg.key.fromMe) return;

            const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            const prefix = "."; 
            if (!messageText.startsWith(prefix)) return;

            const args = messageText.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const command = commands.get(commandName) || aliases.get(commandName);
            if (command) {
                await command.execute(sock, msg, args);
            }
        } catch (err) {
            console.error("❌ خطأ أثناء معالجة الأمر:", err);
        }
    });
}

startBot();
        
