import makeWASocket, { useMultiFileAuthState, DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';

// رقم البوت الخاص بك
const botNumber = '212784776925'; 
global.developerNumber = `${botNumber}@s.whatsapp.net`;

const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
const pluginsFolder = './plugins';
const plugins = new Map();

// دالة فحص وتحميل ملفات الأوامر
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
    console.log(`\x1b[36m⚙️ [النظام] تم تحميل ${plugins.size} أمر من مجلد الإضافات بنجاح.\x1b[0m`);
}

// متغير لمنع تكرار طلب الكود الرقمي
let isPairingCodeRequested = false;

async function startBot() {
    await loadPlugins();
    
    const startSocket = typeof makeWASocket === 'function' ? makeWASocket : makeWASocket.default;
    
    const client = startSocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, 
        auth: state,
        browser: ["Ubuntu", "Chrome", "125.0.0.0"] 
    });

    // توليد الكود الرقمي لمرة واحدة فقط دون تكرار
    if (!client.authState.creds.registered && !isPairingCodeRequested) {
        isPairingCodeRequested = true; // تفعيل الحماية لمنع التكرار
        const cleanedNumber = botNumber.replace(/[^0-9]/g, '');
        
        console.log(`\n\x1b[33m⏳ [جاري الاتصال] جاري طلب الكود الرقمي للرقم: ${cleanedNumber}...\x1b[0m`);
        await delay(6000); 
        
        try {
            const code = await client.requestPairingCode(cleanedNumber);
            
            console.log(`\n\x1b[35m=========================================\x1b[0m`);
            console.log(`\x1b[32m       🔑 كود الربط الرقمي الخاص بك جاهز 🔑\x1b[0m`);
            console.log(`\x1b[35m=========================================\x1b[0m`);
            console.log(`\n              \x1b[1;42;37m  ${code}  \x1b[0m\n`);
            console.log(`\x1b[35m=========================================\x1b[0m`);
            console.log(`\x1b[33m👉 الطريقة:\x1b[0m افتح واتساب -> الأجهزة المرتبطة -> ربط برقم الهاتف -> واكتب الكود أعلاه.`);
            console.log(`\x1b[35m=========================================\x1b[0m\n`);
        } catch (error) {
            console.error('❌ فشل توليد الكود الرقمي:', error);
            isPairingCodeRequested = false; // إعادة التعيين في حال فشل السيرفر ليتيح المحاولة لاحقاً
        }
    }

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            
            // إذا كان سبب الفصل هو انتهاء الجلسة أو تسجيل الخروج، نقوم بإعادة تعيين المتغير لطلب كود جديد
            if (reason === DisconnectReason.loggedOut) {
                console.log('\x1b[31m❌ تم تسجيل الخروج من الجهاز، يرجى حذف مجلد الجلسة وإعادة المحاولة.\x1b[0m');
                isPairingCodeRequested = false;
            } else {
                console.log('\x1b[31m🔄 انقطع الاتصال، جاري إعادة المحاولة...\x1b[0m');
                await delay(5000); // وقت انتظار مستقر قبل إعادة التشغيل لتجنب الحلقات التكرارية
                startBot();
            }
        } else if (connection === 'open') {
            console.log('\n\x1b[32m🚀 [نجاح] تم الاتصال بنجاح! بوت كاكاشي جاهز للعمل.\x1b[0m\n');
            isPairingCodeRequested = false; // تصفير الحالة بعد النجاح
        }
    });

    client.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
            
            const m = chatUpdate.messages[0]; 
            if (!m.message) return;

            if (m.key.fromMe && m.key.id?.startsWith('BAE5') && m.key.id?.length === 16) return;

            const type = Object.keys(m.message)[0];
            const body = type === 'conversation' ? m.message.conversation :
                         type === 'extendedTextMessage' ? m.message.extendedTextMessage.text :
                         type === 'imageMessage' ? m.message.imageMessage.caption :
                         type === 'videoMessage' ? m.message.videoMessage.caption : '';
            
            if (!body.startsWith('.')) return;

            const args = body.trim().split(/ +/);
            const cmdName = args.shift().toLowerCase().slice(1);

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
