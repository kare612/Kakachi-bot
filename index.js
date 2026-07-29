import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

// ==================== [ إعدادات هوية بوت كاكاشي ] ====================
const BOT_NAME = "كاكاشي";
const BOT_NUMBER = "212784776925"; // رقم البوت (سيقوم الكود بتنظيفه تلقائياً)
const DEVELOPER_NUMBER = "212715469251"; // رقم المطور الأساسي

// تنظيف الأرقام لتوحيد صيغة التحقق
const cleanBotNumber = BOT_NUMBER.replace(/[^0-9]/g, '');
const cleanDevNumber = DEVELOPER_NUMBER.replace(/[^0-9]/g, '');

async function connectToKakashiBot() {
    // جلب أحدث إصدار من مكتبة Baileys لضمان استقرار الاتصال
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`ℹ️ تشغيل البوت باستخدام Baileys v${version.join('.')}`);

    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const client = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        version,
        printQRInTerminal: false // الاعتماد الكامل على Pairing Code
    });

    // تفعيل خاصية كود التحقق الرقمي (Pairing Code) بدلاً من الـ QR
    if (!client.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await client.requestPairingCode(cleanBotNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n==================================================`);
                console.log(`🔑 [كود ربط بوت كاكاشي]: \x1b[32m${code}\x1b[0m`);
                console.log(`==================================================\n`);
                console.log(`💡 افتح الواتساب -> الأجهزة المرتبطة -> ربط جهاز -> ربط باستخدام رقم الهاتف، ثم أدخل الكود الموضح بالأعلى.`);
            } catch (err) {
                console.error('❌ فشل في جلب كود التحقق الرقمي، تأكد من الرقم:', err);
            }
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
            const pluginModule = await import(`./plugins/${file}?update=${Date.now()}`); // منع الكاش عند التعديل
            if (pluginModule.default && pluginModule.default.name) {
                plugins[pluginModule.default.name.toLowerCase()] = pluginModule.default;
                console.log(`✅ [${BOT_NAME}]: تم تحميل إضافة: ${pluginModule.default.name}`);
            }
        } catch (err) {
            console.error(`❌ خطأ في تحميل ملف الإضافة ${file}:`, err);
        }
    }

    // ==================== [ استقبال وفحص الرسائل والأوامر ] ====================
    client.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (chatUpdate.type !== 'notify') return;
            const msg = chatUpdate.messages[0];
            if (!msg || !msg.message) return;

            // تجاهل رسائل البوت نفسه لمنع التكرار اللانهائي
            if (msg.key.fromMe) return;

            const chatJid = msg.key.remoteJid;
            
            // استخراج نص الرسالة الذكي يدعم كافة أنواع الرسائل المتطورة
            const messageType = Object.keys(msg.message)[0];
            let body = '';
            
            if (messageType === 'conversation') body = msg.message.conversation;
            else if (messageType === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;
            else if (messageType === 'imageMessage') body = msg.message.imageMessage.caption;
            else if (messageType === 'videoMessage') body = msg.message.videoMessage.caption;
            else if (messageType === 'buttonsResponseMessage') body = msg.message.buttonsResponseMessage.selectedButtonId;
            else if (messageType === 'listResponseMessage') body = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
            else if (messageType === 'templateButtonReplyMessage') body = msg.message.templateButtonReplyMessage.selectedId;

            if (!body) return;

            const prefix = '.';
            if (!body.startsWith(prefix)) return;

            // تفكيك الأمر والوسائط
            const args = body.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // معرفة مرسل الرسالة بدقة (سواء في خاص أو مجموعة)
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const senderNumber = senderJid.split('@')[0];
            const isDeveloper = (senderNumber === cleanDevNumber);

            let commandFound = false;

            // البحث في الإضافات والمترادفات (Alias)
            for (const key in plugins) {
                const plugin = plugins[key];
                if (plugin.name.toLowerCase() === commandName || (plugin.alias && plugin.alias.map(v => v.toLowerCase()).includes(commandName))) {
                    commandFound = true;

                    // التحقق من الصلاحيات للمطور
                    if (plugin.category === 'owner' && !isDeveloper) {
                        return await client.sendMessage(chatJid, { text: `⚠️ عذراً، هذا الأمر مخصص للمطور الأسطوري لبوت كاكاشي فقط!` }, { quoted: msg });
                    }

                    // تفعيل مؤشر القراءة والكتابة لطابع واقعي
                    await client.readMessages([msg.key]);
                    await client.sendPresenceUpdate('composing', chatJid);
                    await delay(500); // محاكاة سرعة الكتابة الفورية

                    // تشغيل الأمر بأمان دون إسقاط البوت
                    try {
                        await plugin.execute(client, msg, args);
                    } catch (cmdError) {
                        console.error(`❌ خطأ أثناء تنفيذ الأمر ${commandName}:`, cmdError);
                        await client.sendMessage(chatJid, { text: `❌ حدث خطأ داخلي أثناء تنفيذ هذا الأمر.` }, { quoted: msg });
                    }
                    break;
                }
            }

            // أمر الرتبة الأساسي المدمج
            if (!commandFound && commandName === 'رتبتي') {
                await client.readMessages([msg.key]);
                const roleText = isDeveloper ? "👑 أنت المطور الأسطوري لبوت كاكاشي ولجهاز التشغيل الكامل!" : "👤 أنت عضو مستخدم للبوت.";
                await client.sendMessage(chatJid, { text: roleText }, { quoted: msg });
            }

        } catch (error) {
            console.error('خطأ في معالجة الرسالة الواردة:', error);
        }
    });

    // ==================== [ إدارة حالة الاتصال ] ====================
    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            if (shouldReconnect) {
                console.log(`🔄 جاري إعادة اتصال بوت ${BOT_NAME}...`);
                connectToKakashiBot();
            } else {
                console.log(`❌ تم تسجيل الخروج. يرجى حذف مجلد session_auth وإعادة ربط البوت.`);
            }
        } else if (connection === 'open') {
            console.log(`\n==================================================`);
            console.log(`🚀 تم تشغيل [بوت كاكاشي] بنجاح وتم ربط الكود الرقمي!`);
            console.log(`==================================================\n`);
        }
    });
}

connectToKakashiBot();
                    
