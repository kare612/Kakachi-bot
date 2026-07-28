import makeWASocket, { useMultiFileAuthState, DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';

// الثوابت الأساسية وأرقام الهواتف المحددة من قبلك
global.developerNumber = '212715469251@s.whatsapp.net'; // رقم المطور
const botNumber = '212784776925'; // رقم البوت الذي سيتم توليد الكود له

const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
const pluginsFolder = './plugins';
const plugins = new Map();

// دالة فحص وتحميل ملفات الأوامر من مجلد plugins تلقائياً
async function loadPlugins() {
    if (!fs.existsSync(pluginsFolder)) fs.mkdirSync(pluginsFolder);
    const files = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js'));
    for (const file of files) {
        try {
            const pluginModule = await import(`./plugins/${file}?update=${Date.now()}`);
            if (pluginModule.default && pluginModule.default.name) {
                plugins.set(pluginModule.default.name.toLowerCase(), pluginModule.default);
                if (pluginModule.default.alias) {
                    pluginModule.default.alias.forEach(alias => plugins.set(alias.toLowerCase(), pluginModule.default));
                }
            }
        } catch (e) {
            console.error(`❌ خطأ في ملف الإضافة ${file}:`, e);
        }
    }
    console.log(`✅ تم تحميل ${plugins.size} أمر واختصار من مجلد الإضافات بنجاح.`);
}

async function startBot() {
    await loadPlugins();
    
    const startSocket = typeof makeWASocket === 'function' ? makeWASocket : makeWASocket.default;
    
    const client = startSocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // تعطيل الـ QR كلياً بناءً على طلبك
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // توليد الكود الرقمي (Pairing Code) بدلاً من الـ QR
    if (!client.authState.creds.registered) {
        console.log(`\n⏳ جاري طلب الكود الرقمي لرقم البوت: ${botNumber}...`);
        await delay(3000); 
        try {
            const code = await client.requestPairingCode(botNumber);
            console.log(`\n🔑 كود الربط الرقمي الخاص بك هو: \x1b[32m${code}\x1b[0m`);
            console.log(`👉 افتح واتساب البوت -> الأجهزة المرتبطة -> ربط برقم الهاتف -> واكتب الكود أعلاه.\n`);
        } catch (error) {
            console.error('❌ فشل توليد الكود الرقمي، تأكد من صحة رقم البوت المكتوب:', error);
        }
    }

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🚀 تم الاتصال بنجاح! بوت كاكاشي متصل بالواتساب وجاهز للرد على الإضافات.');
        }
    });

    // معالجة الرسائل والرد باستخدام ملفات الإضافات (مثل ملف menu.js)
    client.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
            const m = chatUpdate.messages[0]; // قراءة واستخراج الرسالة الأساسية الأولى من المصفوفة
            
            if (!m.message || m.key.fromMe) return;

            const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
            if (!body.startsWith('.')) return;

            const args = body.trim().split(/ +/);
            const cmdName = args.shift().toLowerCase().slice(1);

            const plugin = plugins.get(cmdName);
            if (plugin) {
                await plugin.execute(client, m, args);
            }
        } catch (err) {
            console.error('خطأ أثناء معالجة رسالة الرد:', err);
        }
    });
}

startBot();
        
