import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';

// إعداد مسارات المجلدات لنظام ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إنشاء العميل (Client) وتحديد الصلاحيات (Intents)
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

client.commands = new Collection();

// دالة ذكية للبحث عن الملفات داخل مجلد الإضافات والمجلدات الفرعية
const getFilesRecursively = (dir) => {
    let files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        if (item.isDirectory()) {
            files = [...files, ...getFilesRecursively(path.join(dir, item.name))];
        } else if (item.isFile() && item.name.endsWith('.js')) {
            files.push(path.join(dir, item.name));
        }
    }
    return files;
};

// تحديد مسار مجلد الإضافات الرئيسي
const pluginsPath = path.join(__dirname, 'plugins'); 

// التأكد من وجود المجلد لتجنب كراش البوت
if (!fs.existsSync(pluginsPath)) {
    fs.mkdirSync(pluginsPath);
    console.log('📁 تم إنشاء مجلد plugins تلقائياً، ضع ملفات الأوامر داخله.');
}

// دالة أساسية لتحميل الأوامر بشكل متزامن وبدون أخطاء
const loadCommands = async () => {
    const allCommandFiles = getFilesRecursively(pluginsPath);
    console.log(`🔍 جاري فحص وتحميل [${allCommandFiles.length}] ملف أمر...`);

    for (const filePath of allCommandFiles) {
        try {
            // استدعاء ديناميكي متوافق مع نظام المشروع الحديث
            const fileUrl = 'file://' + filePath;
            const commandModule = await import(fileUrl);
            const command = commandModule.default;
            
            if (command && 'data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`✅ تم تحميل الأمر: ${command.data.name}`);
            } else {
                console.log(`⚠️ ملف غير متوافق أو يفتقد لـ data/execute وتم تخطيه: ${filePath}`);
            }
        } catch (error) {
            console.error(`❌ فشل تحميل الملف البرمجي ${filePath}:`, error);
        }
    }
};

// تشغيل دالة تحميل الأوامر
await loadCommands();

// تم وضع الرمز الخاص بك هنا في سطر التشغيل
client.login('212784776925');
