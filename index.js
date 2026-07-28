const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

// دالة ذكية تقرأ كل الملفات حتى لو كانت داخل مجلدات فرعية كثيرة
const getFilesRecursively = (dir) => {
    let files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        if (item.isDirectory()) {
            // إذا وجد مجلد فرعي، يدخل داخله ويبحث عن ملفات
            files = [...files, ...getFilesRecursively(path.join(dir, item.name))];
        } else if (item.isFile() && item.name.endsWith('.js')) {
            // إذا وجد ملف جافاسكريبت يضيفه للقائمة
            files.push(path.join(dir, item.name));
        }
    }
    return files;
};

// تحديد مسار مجلد الإضافات الرئيسي
const pluginsPath = path.join(__dirname, 'plugins'); 

// جلب جميع مسارات الملفات دفعة واحدة
const allCommandFiles = getFilesRecursively(pluginsPath);

console.log(`🔍 جاري فحص وتحميل [${allCommandFiles.length}] ملف أمر...`);

// حلقة تكرارية لتشغيل وتحميل كل الملفات المكتشفة
for (const filePath of allCommandFiles) {
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ تم تحميل: ${command.data.name}`);
    } else {
        console.log(`⚠️ ملف غير متوافق تم تخطيه: ${filePath}`);
    }
}

client.login('YOUR_BOT_TOKEN_HERE');
