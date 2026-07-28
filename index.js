import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';

// إعداد مسارات المجلدات لنظام ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

client.commands = new Collection();

// دالة قراءة المجلدات الفرعية تلقائياً
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

const pluginsPath = path.join(__dirname, 'plugins'); 

if (!fs.existsSync(pluginsPath)) {
    fs.mkdirSync(pluginsPath);
}

const loadCommands = async () => {
    const allCommandFiles = getFilesRecursively(pluginsPath);
    for (const filePath of allCommandFiles) {
        try {
            const fileUrl = 'file://' + filePath;
            const commandModule = await import(fileUrl);
            const command = commandModule.default;
            
            if (command && 'data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
        } catch (error) {
            console.error(`❌ خطأ في ملف ${filePath}:`, error);
        }
    }
};

await loadCommands();

// قراءة التوكن من ملف الإعدادات الخارجي دون الحاجة لتعديل الكود مجدداً
const token = process.env.DISCORD_TOKEN || 'ضع_التوكن_هنا_إذا_حصلت_عليه_لاحقاً';
client.login(token);
                
