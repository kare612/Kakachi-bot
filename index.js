import makeWASocket, { useMultiFileAuthState, DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';

// رقم البوت الخاص بك تم إدراجة مباشرة لتوليد الكود له بشكل سليم
const botNumber = '212784776925'; 

global.developerNumber = `${botNumber}@s.whatsapp.net`;

const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
const pluginsFolder = './plugins';
const plugins = new Map();

// دالة فحص وتحميل ملفات الأوامر من مجلد plugins تلقائياً
async function loadPlugins() {
    if (!fs.existsSync(pluginsFolder)) fs.mkdirSync(pluginsFolder);
    const files = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js') || file.endsWith('.cjs'));
    
    for (const file of files) {
        try {
            let pluginModule;
            if (file.endsWith('.cjs')) {
                pluginModule = await import(`./plugins/${file}`);
            } else {
                pluginModule = await import(`./plugins/${file}?update=${Date.now()}`);
            }

            const pluginData = pluginModule.default || pluginModule;
            if (pluginData && pluginData.name) {
                plugins.set(pluginData.name.toLowerCase(), pluginData);
                if (pluginData.alias) {
                    pluginData.alias.forEach(alias => plugins.set(alias.toLowerCase(), pluginData));
                }
            }
        } catch (e) {
            console.error(`❌ خطأ في ملف الإضافة ${file}:`, e);
        }
    }
    console.log(`\x1b[36m⚙️ [النظام] تم تحميل ${plugins.size} أمر واختصار من مجلد الإضافات بنجاح.\x1b[0m`);
}

async function startBot() {
    await loadPlugins();
    
    const startSocket = typeof makeWASocket === 'function' ? makeWASocket : makeWASocket.default;
    
    const client = startSocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, 
        auth: state,
        // إصدار متصفح حديث لتجنب رفض السيرفر (خطأ 428)
        browser: ["Ubuntu", "Chrome", "125.0.0.0"] 
    });

    // توليد الكود الرقمي المزخرف للرقم المحدد
    if (!client.authState.creds.registered) {
        const cleanedNumber = botNumber.replace(/[^0-9]/g, '');
        
        console.log(`\n\x1b[33m⏳ [جاري الاتصال] جاري طلب الكود الرقمي للرقم: ${cleanedNumber}...\x1b[0m`);
        await delay(6000); 
        
        try {
            const code = await client.requestPairingCode(cleanedNumber);
            
            // تصميم الكود المزخرف في الـ Terminal
            console.log(`\n\x1b[35m=========================================\x1b[0m`);
            console.log(`\x1b[32m       🔑 كود الربط الرقمي الخاص بك جاهز 🔑\x1b[0m`);
            console.log(`\x1b[35m=========================================\x1b[0m`);
            console.log(`\n              \x1b[1;42;37m  ${code}  \x1b[0m\n`);
            console.log(`\x1b[35m=========================================\x1b[0m`);
            console.log(`\x1b[33m👉 الطريقة:\x1b[0m افتح واتساب -> الأجهزة المرتبطة -> ربط برقم الهاتف -> واكتب الكود أعلاه.`);
            console.log(`\x1b[35m=========================================\x1b[0m\n`);
        } catch (error) {
            console.error('❌ فشل توليد الكود الرقمي. تأكد من صحة الرقم ومستودع الحزم:', error);
        }
    }

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('\x1b[31m🔄 انقطع الاتصال، جاري إعادة المحاولة...\x1b[0m');
                startBot();
            }
        } else if (connection === 'open') {
            console.log('\n\x1b[32m🚀 [نجاح] تم الاتصال بنجاح! بوت كاكاشي متصل بالواتساب وجاهز للرد على الإضافات.\x1b[0m\n');
        }
    });

    // استقبال ومعالجة الأوامر من المجموعات، الخاص، ومن نفسك أيضاً دون حدوث تكرار (Loop)
    client.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
            
            const m = chatUpdate.messages[0]; 
            if (!m.message) return;

            // حظر استجابة البوت للرسائل التلقائية والأزرار الصادرة منه لتفادي التعليق وحظر الحساب
            if (m.key.fromMe && (m.message.buttonsResponseMessage || m.message.templateButtonReplyMessage || m.message.listResponseMessage || m.key.id?.startsWith('BAE5') || m.key.id?.length === 16)) return;

            // قراءة النصوص من المحادثات والوسائط بشكل متوافق
            const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
            
            // التحقق من أن الرسالة تبدأ بنقطة (.) كمشغل للأوامر
            if (!body.startsWith('.')) return;

            const args = body.trim().split(/ +/);
            const cmdName = args.shift().toLowerCase().slice(1);

            // استدعاء وتنفيذ الأمر من مجلد plugins
            const plugin = plugins.get(cmdName);
            if (plugin) {
                console.log(`\x1b[32m💬 [أمر] تم تفعيل (.${cmdName}) بواسطة: ${m.key.remoteJid}\x1b[0m`);
                await plugin.execute(client, m, args);
            }
        } catch (err) {
            console.error('❌ خطأ أثناء معالجة رسالة الرد:', err);
        }
    });
}

startBot();
                
