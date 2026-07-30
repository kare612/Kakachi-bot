import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = new Map();
const aliases = new Map();
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
                if (plugin.default && plugin.default.command) {
                    const cmdArray = Array.isArray(plugin.default.command) ? plugin.default.command : [plugin.default.command];
                    for (const cmd of cmdArray) {
                        commands.set(cmd, plugin.default);
                    }
                    if (plugin.default.aliases) {
                        const aliasArray = Array.isArray(plugin.default.aliases) ? plugin.default.aliases : [plugin.default.aliases];
                        for (const alias of aliasArray) {
                            aliases.set(alias, plugin.default);
                        }
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
        printQRInTerminal: false, // تم الإيقاف لتفعيل كود الاقتران النصي بدلاً من QR
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // كود طلب الاقتران التلقائي عبر رقم الهاتف الخاص بك
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
            console.log('تم إغلاق الاتصال بسبب:', lastDisconnect.error, 'جاري إعادة الاتصال:', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('تم فتح الاتصال بنجاح وتفعيل البوت!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (!text.startsWith('.')) return;

        const args = text.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = commands.get(commandName) || aliases.get(commandName);
        if (!command) return;

        try {
            await command.default({ sock, msg, args });
        } catch (err) {
            console.error(`خطأ أثناء تنفيذ الأمر ${commandName}:`, err);
            await sock.sendMessage(msg.key.remoteJid, { text: 'حدث خطأ أثناء تنفيذ هذا الأمر.' });
        }
    });
}

startBot();
