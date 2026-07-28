import { makeWASocket, useMultiFileAuthState, disconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

// ==================== [ إعدادات هوية بوت كاكاشي ] ====================
const BOT_NAME = "كاكاشي";
const BOT_NUMBER = "212784776925@s.whatsapp.net";        // رقم البوت الخاص بك
const DEVELOPER_NUMBER = "212715469251@s.whatsapp.net";  // رقم المطور الأسطوري

async function connectToKakashiBot() {
    // إعداد جلسة الحفظ التلقائي لتسجيل الدخول دون الحاجة للـ QR كل مرة
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const client = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: [BOT_NAME, 'Chrome', '1.0.0']
    });

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
            if (!msg.message || msg.key.fromMe) return;

            const chatJid = msg.key.remoteJid;
            
            // جلب نص الرسالة بأي شكل كانت (نص، نص ممتد، أو كابشن صورة)
            const messageType = Object.keys(msg.message)[0];
            let body = '';
            if (messageType === 'conversation') body = msg.message.conversation;
            else if (messageType === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;
            else if (messageType === 'imageMessage') body = msg.message.imageMessage.caption;

            // تحديد بادئة الأوامر (البريفكس مثل ".")
            const prefix = '.';
            if (!body.startsWith(prefix)) return;

            // تشريح النص واستخراج اسم الأمر والمُعطيات
            const args = body.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // فحص هوية المرسل (سواء في الخاص أو المجموعات)
            const senderNumber = msg.key.participant || msg.key.remoteJid;
            const isDeveloper = (senderNumber.split('@')[0] === DEVELOPER_NUMBER.split('@')[0]);

            // البحث عن الأمر داخل نظام إضافات كاكاشي وتنفيذه
            let commandFound = false;
            for (const key in plugins) {
                const plugin = plugins[key];
                
                // التحقق من الاسم الأساسي أو الأسماء المستعارة (Alias)
                if (plugin.name === commandName || (plugin.alias && plugin.alias.includes(commandName))) {
                    commandFound = true;

                    // حماية أوامر المطورين
                    if (plugin.category === 'owner' && !isDeveloper) {
                        return await client.sendMessage(chatJid, { text: `⚠️ عذراً، هذا الأمر مخصص للمطور الأسطوري لبوت كاكاشي فقط!` }, { quoted: msg });
                    }

                    // تجهيز المتغيرات وتمريرها لملف اللعبة أو الإضافة
                    const customMessageContext = {
                        chat: chatJid,
                        key: msg.key,
                        message: msg.message,
                        participant: msg.key.participant
                    };

                    await plugin.execute(client, customMessageContext, [commandName, ...args]);
                    break;
                }
            }

            // أمر فحص سريع خاص بالمطور الأسطوري للتأكد من رتبته
            if (!commandFound && commandName === 'رتبتي') {
                const roleText = isDeveloper ? "👑 أنت المطور الأسطوري لبوت كاكاشي ولجهاز التشغيل الكامل!" : "👤 أنت عضو مستخدم للبوت.";
                await client.sendMessage(chatJid, { text: roleText }, { quoted: msg });
            }

        } catch (error) {
            console.error('خطأ في معالجة الرسالة الواردة:', error);
        }
    });

    // مراقبة حالة الاتصال بالواتساب وإعادة تشغيل السيرفر تلقائياً
    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== disconnectReason.loggedOut : true;
            if (shouldReconnect) {
                console.log(`🔄 جاري إعادة اتصال بوت ${BOT_NAME}...`);
                connectToKakashiBot();
            }
        } else if (connection === 'open') {
            console.log(`\n==================================================`);
            console.log(`🚀 تم تشغيل [بوت كاكاشي] بنجاح!`);
            console.log(`📱 رقم البوت: ${BOT_NUMBER.split('@')[0]}`);
            console.log(`👑 المطور الأسطوري: ${DEVELOPER_NUMBER.split('@')[0]}`);
            console.log(`==================================================\n`);
        }
    });
}

// إطلاق البوت
connectToKakashiBot();
        
