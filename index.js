import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import readline from 'readline';

// ==================== [ إعدادات هوية بوت كاكاشي ] ====================
const BOT_NAME = "كاكاشي";
const BOT_NUMBER = "212784776925";                        // رقم البوت بدون أي زيادات
const DEVELOPER_NUMBER = "212715469251@s.whatsapp.net";  // رقم المطور الأسطوري

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function connectToKakashiBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const client = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: [BOT_NAME, 'Chrome', '1.0.0']
    });

    // تفعيل خاصية كود التحقق الرقمي (Pairing Code) بدلاً من الـ QR
    if (!client.authState.creds.registered) {
        setTimeout(async () => {
            let code = await client.requestPairingCode(BOT_NUMBER);
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log(`\n🔑 [كود ربط بوت كاكاشي]: ${code}\n`);
            console.log(`💡 افتح الواتساب -> الأجهزة المرتبطة -> ربط جهاز -> ربط باستخدام رقم الهاتف، ثم أدخل الكود الموضح بالأعلى.`);
        }, 3000);
    }

    client.ev.on('creds.update', saveCreds);

    // ==================== [ تحميل ملفات الإضافات تلقائياً ] ====================
    const plugins = {};
    const pluginsDir = path.join(process.cwd(), 'plugins');

    if (!fs.existsSync(pluginsDir)) {
        fs.mkdirSync(pluginsDir);
    }

    const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of pluginFiles) {
        try {
            const pluginModule = await import(`./plugins/${file}`);
            if (pluginModule.default && pluginModule.default.name) {
                plugins[pluginModule.default.name] = pluginModule.default;
                console.log(`✅ [${BOT_NAME}]: تم تحميل إضافة: ${pluginModule.default.name}`);
            }
        } catch (err) {
            console.error(`❌ خطأ في تحميل ملف الإضافة ${file}:`, err);
        }
    }

    // ==================== [ استقبال وفحص الرسائل والأوامر ] ====================
    client.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg || !msg.message || msg.key.fromMe) return;

            const chatJid = msg.key.remoteJid;
            
            const messageType = Object.keys(msg.message)[0];
            let body = '';
            if (messageType === 'conversation') body = msg.message.conversation;
            else if (messageType === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;
            else if (messageType === 'imageMessage') body = msg.message.imageMessage.caption;

            const prefix = '.';
            if (!body.startsWith(prefix)) return;

            const args = body.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const senderNumber = msg.key.participant || msg.key.remoteJid;
            const isDeveloper = (senderNumber.split('@')[0] === DEVELOPER_NUMBER.split('@')[0]);

            let commandFound = false;
            for (const key in plugins) {
                const plugin = plugins[key];
                
                if (plugin.name === commandName || (plugin.alias && plugin.alias.includes(commandName))) {
                    commandFound = true;

                    if (plugin.category === 'owner' && !isDeveloper) {
                        return await client.sendMessage(chatJid, { text: `⚠️ عذراً، هذا الأمر مخصص للمطور الأسطوري لبوت كاكاشي فقط!` }, { quoted: msg });
                    }

                    await plugin.execute(client, msg, args);
                    break;
                }
            }

            if (!commandFound && commandName === 'رتبتي') {
                const roleText = isDeveloper ? "👑 أنت المطور الأسطوري لبوت كاكاشي ولجهاز التشغيل الكامل!" : "👤 أنت عضو مستخدم للبوت.";
                await client.sendMessage(chatJid, { text: roleText }, { quoted: msg });
            }

        } catch (error) {
            console.error('خطأ في معالجة الرسالة الواردة:', error);
        }
    });

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            if (shouldReconnect) {
                console.log(`🔄 جاري إعادة اتصال بوت ${BOT_NAME}...`);
                connectToKakashiBot();
            }
        } else if (connection === 'open') {
            console.log(`\n==================================================`);
            console.log(`🚀 تم تشغيل [بوت كاكاشي] بنجاح عن طريق كود التحقق الرقمي!`);
            console.log(`==================================================\n`);
        }
    });
}

connectToKakashiBot();
                
