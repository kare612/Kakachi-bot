import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = new Map();
const pluginsFolder = path.join(__dirname, 'plugins');

async function loadPlugins() {
    if (!fs.existsSync(pluginsFolder)) {
        fs.mkdirSync(pluginsFolder);
    }
    const files = fs.readdirSync(pluginsFolder);
    for (const file of files) {
        if (file.endsWith('.js')) {
            const pluginPath = path.join(pluginsFolder, file);
            const fileUrl = `file://${pluginPath}`;
            try {
                const plugin = await import(fileUrl);
                const validPlugin = plugin.default || plugin;
                
                if (validPlugin && validPlugin.command) {
                    const cmdArray = Array.isArray(validPlugin.command) ? validPlugin.command : [validPlugin.command];
                    for (const cmd of cmdArray) {
                        commands.set(cmd.toLowerCase(), validPlugin);
                    }
                }
            } catch (err) {
                console.error(`خطأ في تحميل الإضافة ${file}:`, err);
            }
        }
    }
}

async function startBot() {
    await loadPlugins();
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925"; 
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n=================================`);
                console.log(`🔑 كود الاقتران الخاص بك هو: ${code}`);
                console.log(`=================================\n`);
            } catch (error) {
                console.error("فشل في طلب كود الاقتران:", error);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            console.log('تم إغلاق الاتصال، جاري إعادة الاتصال:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ تم فتح الاتصال بنجاح وتفعيل البوت واصبح جاهزاً للرد!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        const msg = m.messages[0]; // قراءة الرسالة الأولى المتاحة في المصفوفة
        if (!msg || !msg.message) return;

        // طريقة متطورة وشاملة لاستخراج النص البرمي الصحيح من المحادثة
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.imageMessage?.caption || 
                     msg.message.videoMessage?.caption || '';

        if (!text.startsWith('.')) return;

        const args = text.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = commands.get(commandName);
        if (!command) return;

        try {
            // التحقق من تفعيل الدالة وتشغيلها بشكل آمن
            if (command.default && typeof command.default === 'function') {
                await command.default({ sock, msg, args });
            } else if (typeof command === 'function') {
                await command({ sock, msg, args });
            } else if (command.execute && typeof command.execute === 'function') {
                await command.execute({ sock, msg, args });
            }
        } catch (err) {
            console.error(`خطأ أثناء تنفيذ الأمر ${commandName}:`, err);
            const chatJid = msg.key.remoteJid;
            await sock.sendMessage(chatJid, { text: 'حدث خطأ داخلي أثناء تنفيذ هذا الأمر.' });
        }
    });
}

startBot();
            
