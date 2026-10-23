import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';

// رقم الهاتف الخاص بالبوت
const phoneNumber = "212784776925";
const pluginsFolder = './ايضافة'; // مجلد الأوامر والإضافات الخاص بك
const commands = new Map(); // خريطة حفظ الأوامر المستدعاة تلقائياً

// 📂 دالة فحص وتحميل كافة الملفات البرمجية من مجلد "ايضافة" ديناميكياً
async function loadPlugins() {
    if (!fs.existsSync(pluginsFolder)) {
        fs.mkdirSync(pluginsFolder);
    }
    
    commands.clear(); // تنظيف الذاكرة المؤقتة لمنع تعارض الحزم عند إعادة التشغيل
    const files = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js'));
    console.log(`\n📂 [نظام الإضافات]: جاري فحص مجلد [ايضافة]... تم العثور على (${files.length}) ملفات أوامر.`);
    
    for (const file of files) {
        try {
            const filePath = path.join(pluginsFolder, file);
            // استدعاء الملف باستخدام Dynamic Import المتوافق مع ES Modules مع إضافة طابع زمني لمنع التخزين المؤقت للنسخ التالفة
            const plugin = await import(`./${filePath.replace(/\\/g, '/')}?update=${Date.now()}`);
            
            if (plugin.default && plugin.default.command) {
                plugin.default.command.forEach(cmd => {
                    commands.set(cmd.trim().toLowerCase(), plugin.default);
                });
                console.log(`  ✅ تم تحميل الإضافة بنجاح من الملف: [${file}]`);
            }
        } catch (error) {
            console.error(`  ❌ فشل تحميل ملف الأمر [${file}]:`, error);
        }
    }
}

async function startKakashiBot() {
    // تحميل الأوامر من مجلد الإضافات فور بدء السيرفر
    await loadPlugins();

    // إعداد وتثبيت مجلد الجلسة للحفاظ على استقرار الربط الرقمي
    const { state, saveCreds } = await useMultiFileAuthState('./kakashi_session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, // الاعتماد الكلي على كود الربط الرقمي بدلاً من الـ QR
        logger: pino({ level: 'silent' }), // إخفاء سجلات الحزم الزائدة لتنظيف واجهة ترمكس
        browser: ["Ubuntu", "Chrome", "20.0.04"], 
    });

    // توليد كود الربط الرقمي فقط إذا لم تكن هناك جلسة سابقة متصلة وموثقة
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                console.log(`\n⏳ [الربط الرقمي]: جاري طلب كود التحقق للرقم: ${phoneNumber}...`);
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                
                console.log('\n==================================================');
                console.log(`🔑 كود ربط بوت كاكاشي الخاص بك هو: 【 ${code} 】`);
                console.log('==================================================');
                console.log('💡 افتح الواتساب في هاتفك -> الأجهزة المرتبطة -> ربط هاتف برقم الهاتف -> ثم أدخل الكود.');
            } catch (error) {
                console.error('❌ حدث خطأ غير متوقع أثناء طلب كود الربط الرقمي:', error);
            }
        }, 3000);
    }

    // إدارة حالة الاتصال وإعادة الاتصال التلقائي المستقر
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut 
                : true;
            
            console.log('⚠️ انقطع الاتصال مع سيرفرات الواتساب. جاري محاولة إعادة الاتصال تلقائياً:', shouldReconnect);
            if (shouldReconnect) startKakashiBot();
        } else if (connection === 'open') {
            console.log('\n🚀 [نجاح الاتصال]: تم تشغيل بوت كاكاشي بنجاح! الأوامر مفعّلة الآن ومستقرة تماماً ✅\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // 📩 استقبال وقراءة وتحليل الرسائل الواردة برمجياً وتنفيذ الأوامر بدقة
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const msg = chatUpdate.messages[0]; // قراءة كائن الرسالة المباشرة الأولى الواردة
            if (!msg.message || msg.key.fromMe) return;

            const messageType = Object.keys(msg.message)[0];
            let text = '';
            
            if (messageType === 'conversation') {
                text = msg.message.conversation;
            } else if (messageType === 'extendedTextMessage') {
                text = msg.message.extendedTextMessage.text;
            }

            const cleanText = text.trim();

            // فحص أمر تجربة سرعة استجابة واستقرار اتصال البوت
            if (cleanText === '.ping') {
                await sock.sendMessage(msg.key.remoteJid, { text: 'pong! 🤖 نظام الاستدعاء التلقائي للمجلد يعمل بكفاءة قصوى.' }, { quoted: msg });
                return;
            }

            // فحص وتشغيل الأوامر الديناميكية القادمة من مجلد [ايضافة]
            if (cleanText.startsWith('.')) {
                // استخراج الكلمة الأولى بعد النقطة كنص فريد بدقة (بدون فواصل أو مسافات زمرية)
                const parts = cleanText.slice(1).trim().split(/\s+/);
                const commandName = parts[0].toLowerCase(); // اسم الأمر النصي (مثل: الاوامر، فحص)
                const args = parts.slice(1); // المتغيرات التابعة للأمر

                // المطابقة الصحيحة والمباشرة داخل خريطة الإضافات المخزنة
                if (commands.has(commandName)) {
                    const activePlugin = commands.get(commandName);
                    // استدعاء دالة التشغيل الافتراضية داخل ملف الإضافة وتمرير الأدوات لها
                    await activePlugin.default({ sock, msg, args });
                }
            }
        } catch (err) {
            console.error('❌ خطأ برمي أثناء معالجة تفاصيل الرسالة الواردة:', err);
        }
    });
}

// البدء التلقائي للبوت
startKakashiBot();
        
