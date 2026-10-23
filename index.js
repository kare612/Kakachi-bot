import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';

// رقم الهاتف الخاص بك المعتمد للبوت
const phoneNumber = "212784776925";

async function startKakashiBot() {
    // 1. تحديد مجلد حفظ الجلسة لضمان عدم تجدد الأكواد وثبات الاتصال
    const { state, saveCreds } = await useMultiFileAuthState('./kakashi_session');
    
    // جلب أحدث إصدار متوافق من واجهة واتساب ويب
    const { version } = await fetchLatestBaileysVersion();

    // 2. تهيئة إعدادات الاتصال بالواتساب
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, // تعطيل الـ QR تماماً لاعتماد الكود الرقمي
        logger: pino({ level: 'silent' }), // إخفاء السجلات غير الضرورية لتقليل الفوضى بالشاشة
        browser: ["Ubuntu", "Chrome", "20.0.04"], // إعداد المتصفح الافتراضي للربط
    });

    // 3. طلب كود الربط الرقمي (يتم استدعاؤه فقط إذا لم تكن هناك جلسة مسجلة)
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                console.log(`\n⏳ جاري طلب كود الربط الرقمي للرقم: ${phoneNumber}...`);
                let code = await sock.requestPairingCode(phoneNumber);
                
                // تنسيق الكود ليظهر بشكل واضح وسهل القراءة
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                
                console.log('\n==================================================');
                console.log(`🔑 كود ربط بوت كاكاشي الخاص بك هو: 【 ${code} 】`);
                console.log('==================================================');
                console.log('💡 افتح الواتساب في هاتفك -> الأجهزة المرتبطة -> ربط هاتف برقم الهاتف -> ثم أدخل الكود.');
                console.log('⚠️ الكود سيبقى ثابتاً الآن بانتظار إدخاله بالهاتف...');
            } catch (error) {
                console.error('❌ حدث خطأ أثناء طلب كود الربط:', error);
            }
        }, 3000); // مهلة 3 ثوانٍ للتأكد من استقرار السيرفر قبل طلب الكود
    }

    // 4. مراقبة حالة الاتصال وتحديث الجلسة
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut 
                : true;
            
            console.log('⚠️ تم إغلاق الاتصال. السبب:', lastDisconnect?.error, 'جاري إعادة الاتصال تلقائياً:', shouldReconnect);
            
            // إعادة التشغيل تلقائياً في حال انقطع الاتصال لأي سبب غير تسجيل الخروج الكامل
            if (shouldReconnect) {
                startKakashiBot();
            }
        } else if (connection === 'open') {
            console.log('\n🚀 تم الاتصال بنجاح! بوت كاكاشي جاهز الآن ومستقر ومثبت على هاتفك ✅');
        }
    });

    // 5. حفظ بيانات الجلسة والمصادقة تلقائياً عند تغييرها
    sock.ev.on('creds.update', saveCreds);

    // 6. التعامل مع الرسائل والأوامر القادمة
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;

            const messageType = Object.keys(m.message)[0];
            const text = messageType === 'conversation' ? m.message.conversation : 
                         messageType === 'extendedTextMessage' ? m.message.extendedTextMessage.text : '';

            // هنا يمكنك إضافة منطق معالجة الـ 700 أمر الخاص ببوتك مستقبلاً
            if (text === '.ping') {
                await sock.sendMessage(m.key.remoteJid, { text: 'pong! 🤖 البوت يعمل بنجاح.' }, { quoted: m });
            }
        } catch (err) {
            console.error('خطأ في معالجة الرسالة الواردة:', err);
        }
    });
}

// تشغيل البوت للمرة الأولى
startKakashiBot();
