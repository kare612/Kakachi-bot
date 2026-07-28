import makeWASocket, { useMultiFileAuthState, DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';

// ضع رقمك هنا مباشرة (بدون علامة + أو مسافات، مثال: 9665XXXXXXXX)
const botNumber = 'ضع_رقمك_هنا_بدون_علامة_زائد'; 

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
        printQRInTerminal: false, // معطل بناءً على طلبك للاعتماد على الكود الرقمي
        auth: state,
        // تحديث إصدار المتصفح لإصدار حديث (حل مشكلة خطأ 428)
        browser: ["Ubuntu", "Chrome", "125.0.0.0"] 
    });

    // تنظيف رقم الهاتف وتوليد الكود الرقمي المزخرف
    if (!client.authState.creds.registered) {
        // تنظيف الرقم من أي رموز أو مسافات أو علامة + ليقبله السيرفر فوراً
        const cleanedNumber = botNumber.replace(/[^0-9]/g, '');
        
        console.log(`\n\x1b[33m⏳ [جاري الاتصال] جاري طلب الكود الرقمي للرقم: ${cleanedNumber}...\x1b[0m`);
        await delay(6000); // زيادة وقت الانتظار لضمان استقرار الاتصال قبل الطلب
        
        try {
            const code = await client.requestPairingCode(cleanedNumber);
            
            // زخرفة وتنسيق ظهور كود الربط في الواجهة
            console.log(`\n\x1b[35m=========================================\x1b[0m`);
            console.log(`\x1b[32m       🔑 كود الربط الرقمي الخاص بك جاهز 🔑\x1b[0m`);
            console.log(`\x1b[35m=========================================\x1b[0m`);
            console.log(`\n              \x1b[1;42;37m  ${code}  \x1b[0m\n`);
            console.log(`\x1b[35m=========================================\x1b[0m`);
            console.log(`\x1b[33m👉 الطريقة:\x1b[0m افتح واتساب -> الأجهزة المرتبطة -> ربط برقم الهاتف -> واكتب الكود أعلاه.`);
            console.log(`\x1b[35m=========================================\x1b[0m\n`);
        } catch (error) {
            console.error('❌ فشل توليد الكود الرقمي. تأكد من تحديث حزمة Baileys ومن صحة الرقم المكتوب:', error);
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

    // معالجة الرسائل والرد واستقبال الأوامر
    client.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
            
            const m = chatUpdate.messages[0]; 
            if (!m.message) return;

            // استخراج نص الرسالة بشكل كامل وصحيح
            const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
            
            // التحقق من أن الرسالة تبدأ بنقطة كمشغل للأوامر (.)
            if (!body.startsWith('.')) return;

            // فصل الأمر عن الكلمات المصاحبة (Arguments)
            const args = body.trim().split(/ +/);
            const cmdName = args.shift().toLowerCase().slice(1);

            // البحث عن الأمر داخل مجلد الإضافات المحملة لتنفيذه
            const plugin = plugins.get(cmdName);
            if (plugin) {
                console.log(`\x1b[32m💬 [أمر] تم تفعيل الأمر (.${cmdName}) بواسطة: ${m.key.remoteJid}\x1b[0m`);
                await plugin.execute(client, m, args);
            }
        } catch (err) {
            console.error('❌ خطأ أثناء معالجة رسالة الرد:', err);
        }
    });
}

startBot();
        
