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
            // استخدام import() الديناميكي لقراءة export default
            const pluginModule = await import(`./plugins/${file}`);
            const plugin = pluginModule.default;

            if (plugin && plugin.name) {
                // تسجيل الاسم الرئيسي للأمر
                commands.set(plugin.name, plugin);

                // تسجيل الأسماء المستعارة (مثل menu, أوامر، help) إذا وجدت
                if (plugin.alias && Array.isArray(plugin.alias)) {
                    for (const aliasName of plugin.alias) {
                        aliases.set(aliasName, plugin);
                    }
                }
                console.log(`✅ تم تحميل أمر القائمة بنجاح: ${plugin.name}`);
            }
        } catch (error) {
            console.error(`❌ خطأ في تحميل ملف الإضافة ${file}:`, error);
        }
    }
}

// استدعاء دالة التحميل
await loadPlugins();

// داخل حدث استقبال الرسائل (WhatsApp Messages Upsert)
client.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        // الحصول على نص الرسالة
        const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        
        // تحديد البريفكس المستعمل (النقطة .)
        const prefix = "."; 
        if (!messageText.startsWith(prefix)) return;

        // تفكيك النص لاستخراج اسم الأمر والمدخلات
        const args = messageText.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // البحث عن الأمر بالاسم الرئيسي أو عبر الاسم المستعار (Alias)
        const command = commands.get(commandName) || aliases.get(commandName);

        if (command) {
            // تشغيل دالة execute المكتوبة في ملف menu.js الخاص بك
            await command.execute(client, msg, args);
        }
    } catch (err) {
        console.error("خطأ أثناء تنفيذ الأمر المعين:", err);
    }
});
        
