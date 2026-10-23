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

// دالة فحص وتحميل الإضافات بشكل آمن ومتوافق
async function loadPlugins() {
    if (!fs.existsSync(pluginsFolder)) {
        fs.mkdirSync(pluginsFolder);
    }
    
    commands.clear();
    const files = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js'));
    console.log(`\n📂 [النظام]: جاري قراءة مجلد [ايضافة]... تم العثور على (${files.length}) ملفات.`);
    
    for (const file of files) {
        try {
            const filePath = path.join(pluginsFolder, file);
            // استخدام الطابع الزمني لتحديث الكاش تلقائياً
            const plugin = await import(`./${filePath.replace(/\\/g, '/')}?update=${Date.now()}`);
            
            if (plugin.default && plugin.default.command) {
                // ربط كلمات الأمر بالدالة الافتراضية
                plugin.default.command.forEach(cmd => {
                    commands.set(cmd.trim().toLowerCase(), plugin.default);
                });
                console.log(`  ✅ تم تفعيل ملف الأمر بنجاح: [${file}]`);
            }
        } catch (error) {
            console.error(`  ❌ خطأ في قراءة ملف [${file}]:`, error);
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
                console.log(`\n⏳ جاري طلب كود التحقق للرقم: ${phoneNumber}...`);
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log('\n==================================================');
                console.log(`🔑 كود ربط بوت كاكاشي الخاص بك هو: 【 ${code} 】`);
                console.log('==================================================');
            } catch (error) {
                console.error('❌ خطأ في طلب الكود الرقمي:', error);
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
            console.log('\n🚀 تم الاتصال بنجاح! جميع ملفات مجلد [ايضافة] شتغالة الآن ومستقرة ✅\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0]; // قراءة نص الرسالة الأولى بدقة ككائن مستقر
            if (!msg.message || msg.key.fromMe) return;

            const messageType = Object.keys(msg.message)[0];
            let text = '';
            
            if (messageType === 'conversation') {
                text = msg.message.conversation;
            } else if (messageType === 'extendedTextMessage') {
                text = msg.message.extendedTextMessage.text;
            }

            const cleanText = text.trim();
            if (!cleanText) return;

            // 1. فحص أمر البينج السريع والمباشر المدمج
            if (cleanText === '.ping') {
                await sock.sendMessage(msg.key.remoteJid, { text: 'pong! 🤖 البوت متصل ونظام المجلد مفعّل بالكامل.' }, { quoted: msg });
                return;
            }

            // 2. معالجة وتشغيل أوامر مجلد [ايضافة] الديناميكية
            if (cleanText.startsWith('.')) {
                // تقسيم النص بدقة لاستخراج الكلمة الأولى بعد النقطة مباشرة كم نص نظيف
                const parts = cleanText.slice(1).trim().split(/ +/);
                const commandName = parts[0].toLowerCase(); // الكلمة الأولى بعد النقطة (اسم الأمر مثل: فحص)
                const args = parts.slice(1);

                // البحث داخل الخريطة الموثقة للإضافات
                if (commands.has(commandName)) {
                    const activePlugin = commands.get(commandName);
                    // [تعديل]: استدعاء الدالة مباشرة لأننا قمنا بتخزين الـ default مسبقاً
                    await activePlugin({ sock, msg, args });
                }
            }
        } catch (err) {
            console.error('❌ خطأ أثناء استقبال الرسالة وتحليل الأمر:', err);
        }
    });
}

startKakashiBot();
        
