import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs';

// إعداد الجلسة والمجلدات الخاصة بالإضافات والأوامر
const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
const pluginsFolder = './plugins';
const plugins = new Map();

// دالة فحص وتحميل ملفات الأوامر من مجلد plugins
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
    console.log(`✅ تم تحميل ${plugins.size} أمر واختصار بنجاح.`);
}

async function startBot() {
    await loadPlugins();
    
    // التحقق من طريقة تصدير الدالة لتفادي أخطاء الإصدارات المختلفة لمكتبة Baileys
    const startSocket = typeof makeWASocket === 'function' ? makeWASocket : makeWASocket.default;
    
    const client = startSocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🚀 البوت متصل الآن وجاهز تماماً للرد!');
        }
    });

    // معالجة الرسائل القادمة وفك المصفوفة لتمريرها إلى ملف الـ plugins
    client.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
            const m = chatUpdate.messages[0]; // قراءة واستخراج الرسالة الأساسية الأولى من المصفوفة
            
            if (!m.message || m.key.fromMe) return;

            // قراءة نص الرسالة سواء كانت نصاً عادياً أو رسالة مقتبسة/موسعة
            const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
            if (!body.startsWith('.')) return; // البادئة هنا هي النقطة (.)

            const args = body.trim().split(/ +/);
            const cmdName = args.shift().toLowerCase().slice(1); // استخراج اسم الأمر

            // البحث عن الإضافة المبرمجة وتشغيلها فوراً (مثل ملف menu.js)
            const plugin = plugins.get(cmdName);
            if (plugin) {
                await plugin.execute(client, m, args);
            }
        } catch (err) {
            console.error('خطأ أثناء معالجة الرد والاتصال بالـ plugins:', err);
        }
    });
}

startBot();
