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

// قائمة الكلمات النابية، السب بجميع اللهجات، ومصطلحات التبنيد الحساسة لسلامة رقمك
const badWords = [
    "قحبة", "شرموطة", "شرموطه", "امك", "أمك", "منيوك", "كس", "زب", "طيز", "عرص", 
    "خنيث", "اغتصب", "اغتصاب", "نيك", "تناك", "شذوذ", "بورن", "سكس", "اباحي", 
    "زامل", "قlaوي", "طبون", "حو", "خرا", "خول", "شمال", "وسخ", "ابن_ال",
    "تبنيد", "بند", "ابندك", "حظر_رقم", "كود_حظر", "هكر", "سيرفر"
];

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
                // تخطي المشاكل البرمجية للملفات القديمة المتواجدة في مجلد الإضافات لعدم إغلاق البوت
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
                
                // تكرار صوت التنبيه واهتزاز تيرموكس 3 مرات لجلب انتباهك فوراً لإدخال الكود
                for(let i=0; i<3; i++) {
                    process.stdout.write('\x07'); 
                }
                
                console.log(`\n🚨🔔 [إشعار تنبيه] الكود جاهز الآن! قم بنسخه فوراً 🔔🚨`);
                console.log(`=================================`);
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
            console.log('🔄 تم فصل الاتصال، جاري التحديث التلقائي وإعادة المحاولة...');
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ تم فتح الاتصال بنجاح وتفعيل البوت ونظام الحماية الصارمة!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        const msg = m.messages[0];
        if (!msg || !msg.message) return;

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = msg.key.participant || msg.key.remoteJid;
        const type = Object.keys(msg.message);

        // استخراج نصوص المحادثات حتى لو كانت في وصف الصور والفيديوهات
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.imageMessage?.caption || 
                     msg.message.videoMessage?.caption || '';

        // ------ نظام الحماية الصارمة الفوري المدمج ------
        if (isGroup) {
            // 1. فحص الروابط والإعلانات الخارجية
            const hasLink = /(https?:\/\/[^\s]+)/gi.test(text) || text.includes('://whatsapp.com') || text.includes('wa.me');
            // 2. فحص السب الشامل بجميع اللهجات
            const hasBadWord = badWords.some(word => text.toLowerCase().includes(word.toLowerCase()));
            // 3. فحص كروت الاتصال
            const isContact = type.includes('contactMessage') || type.includes('contactsArrayMessage');
            // 4. فحص الملصقات لحماية الرقم من التبنيد
            const isSticker = type.includes('stickerMessage');

            if (hasLink || hasBadWord || isContact || isSticker) {
                try {
                    const groupMetadata = await sock.groupMetadata(from);
                    const participants = groupMetadata.participants;
                    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    
                    const isBotAdmin = participants.find(p => p.id === botNumber)?.admin;
                    const isSenderAdmin = participants.find(p => p.id === sender)?.admin;

                    // استثناء المشرفين من العقوبة
                    if (!isSenderAdmin && isBotAdmin) {
                        // حذف المخالفة
                        await sock.sendMessage(from, { delete: msg.key });

                        let reason = "مخالفة قوانين المجموعة";
                        if (isSticker) reason = "إرسال ملصق (ممنوع لسلامة رقم البوت من البند)";
                        if (hasLink) reason = "نشر روابط إعلانية خارجية";
                        if (hasBadWord) reason = "استخدام ألفاظ نابية، سباب، أو عبارات حساسة";
                        if (isContact) reason = "مشاركة كروت اتصال وأرقام";

                        // طرد العضو المخالف فوراً
                        await sock.groupParticipantsUpdate(from, [sender], 'remove');

                        // إرسال رسالة التنبيه للأعضاء الآخرين
                        await sock.sendMessage(from, { 
                            text: `🚨 **رادار الحماية الشاملة!**\n\n👤 **المخالف:** @${sender.split('@')[0]}\n⚠️ **السبب:** ${reason}\n🔨 **العقوبة:** الطرد التلقائي الفوري وحذف الرسالة.`,
                            mentions: [sender]
                        });
                        return; // الخروج لمنع تشغيل أي أوامر أخرى للمخالف
                    }
                } catch (e) {
                    console.error("خطأ في تطبيق عقوبة نظام الحماية:", e);
                }
            }
        }

        // تشغيل الأوامر العادية للبوت في حال لم يكن هناك مخالفة
        if (!text.startsWith('.')) return;
        const args = text.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);
        if (!command) return;

        try {
            if (command.default && typeof command.default === 'function') {
                await command.default({ sock, msg, args });
            } else if (typeof command === 'function') {
                await command({ sock, msg, args });
            } else if (command.execute && typeof command.execute === 'function') {
                await command.execute({ sock, msg, args });
            }
        } catch (err) {
            console.error(`خطأ أثناء تنفيذ الأمر ${commandName}:`, err);
            await sock.sendMessage(from, { text: 'حدث خطأ داخلي أثناء تنفيذ هذا الأمر.' });
        }
    });
}

startBot();
        
