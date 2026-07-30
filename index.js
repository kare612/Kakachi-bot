import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// خريطة لتخزين الأوامر والأسماء المستعارة (Alias)
const commands = new Map();
const aliases = new Map();

// تحديد مسار مجلد الإضافات (plugins)
const pluginsFolder = path.join(__dirname, 'plugins');

// دالة تحميل الإضافات تلقائياً عند بدء التشغيل
async function loadPlugins() {
    if (!fs.existsSync(pluginsFolder)) {
        console.log("⚠️ مجلد الإضافات plugins غير موجود!");
        return;
    }

    const files = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js'));

    for (const file of files) {
        try {
            // استيراد ديناميكي يدعم صيغ الـ export default
            const pluginModule = await import(`./plugins/${file}`);
            const plugin = pluginModule.default;

            if (plugin && plugin.name) {
                commands.set(plugin.name, plugin);

                // تسجيل الأسماء المستعارة (مثل menu, أوامر، help) إذا وجدت
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

// دالة بدء تشغيل البوت والاتصال بالواتساب
async function startBot() {
    await loadPlugins();

    const { state, saveCreds } = await useMultiFileAuthState('session');

    // إنشاء اتصال الواتساب بالمتغير الصحيح sock
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // تغييرها لـ false إذا كنت تستخدم كود الربط الرقمي الـ Pairing
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    // معالجة حدث استقبال ومعالجة الرسائل والأوامر
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            
            // البادئة (البريفكس) المستعملة للأوامر
            const prefix = "."; 
            if (!messageText.startsWith(prefix)) return;

            const args = messageText.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // البحث عن الأمر بالاسم الرئيسي أو عبر الاسم المستعار (Alias)
            const command = commands.get(commandName) || aliases.get(commandName);

            if (command) {
                // تنفيذ الأمر بإرسال المتغيرات الثلاثة (sock, msg, args)
                await command.execute(sock, msg, args);
            }
        } catch (err) {
            console.error("❌ خطأ أثناء معالجة الأمر داخل الشات:", err);
        }
    });

    // إدارة حالة الاتصال وإعادة التشغيل التلقائي عند انقطاع الشبكة
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🔄 تم إغلاق الاتصال بسبب الخطأ، جاري إعادة المحاولة: ', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🚀 تم تشغيل بوت كاكاشي بنجاح والاتصال بالواتساب مستقر الآن!');
        }
    });
}

startBot();
