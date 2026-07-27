// ملف المعالجة الشامل المحدث لبوت كاكاشي - يجمع كل الإضافات والأنظمة المتقدمة
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

// إعدادات البوت الأساسية ورابط القناة الرسمي
const phoneNumber = "212784776925";
const CHANNEL_LINK = "https://whatsapp.com";

async function handleAllCommands(client, m) {
    try {
        if (!m.message || m.key.fromMe) return;

        // جلب الرسائل النصية
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!text.startsWith('.')) return;

        const args = text.trim().split(/ +/).slice(1);
        const command = text.trim().split(/ +/)[0].slice(1).toLowerCase();
        const userId = m.sender;
        const isOwner = m.key.remoteJid.includes(phoneNumber);

        // تهيئة وحفظ قاعدة البيانات التلقائية لأرقام الألعاب والنقابات
        if (!global.db) global.db = {};
        if (!global.db.users) global.db.users = {};
        if (!global.db.guilds) global.db.guilds = {};

        if (!global.db.users[userId]) {
            global.db.users[userId] = { money: 1000, xp: 0, level: 1, gamesWon: 0, joinedChannel: false };
        }
        const user = global.db.users[userId];

        // =========================================================================
        // 📜 [1] قسم القائمة الرئيسية وعرض الأوامر (.الاوامر / .menu)
        // =========================================================================
        if (command === 'الاوامر' || command === 'اوامر' || command === 'قائمة' || command === 'menu') {
            const menuText = `⚡ *KAKASHI BOT CORE SYSTEM v3.0* ⚡\n\n` +
                             `👤 USER: @${userId.split('@')[0]}\n` +
                             `⭐ LEVEL: [ ${user.level} ] | 💰 BANK: $${user.money}\n` +
                             `-------------------------------------------\n\n` +
                             `🎬 *[1] MULTIMEDIA SYSTEMS*\n` +
                             `• .فيديو [رابط] -> تحميل الميديا والفيديوهات مباشرة\n` +
                             `• .لصورة -> تحويل الملصق (Sticker) إلى صورة ثابتة\n\n` +
                             `🎮 *[2] GAMES & RPG SYSTEMS*\n` +
                             `• .العاب زواج -> قرعة الزواج العشوائي بالصور بالجروب\n` +
                             `• .العاب خمن -> تشغيل تحدي تخمين الصور التفاعلي\n\n` +
                             `⚔️ *[3] GUILDS & GANGS SYSTEM*\n` +
                             `• .نقابة إنشاء [الاسم] -> تأسيس عصابتك ونقابتك الخاصة\n` +
                             `• .نقابة انضمام [الاسم] -> الانضمام لنقابة مقاتلين قائمة\n` +
                             `• .نقابة قائمتي -> عرض الأعضاء والمستوى الإجمالي للنقابة\n\n` +
                             `📊 *[4] LEADERBOARD & REWARDS*\n` +
                             `• .أرقام -> عرض ملف الأرقام وإحصائيات ألعابك بالكامل\n` +
                             `• .أرقام ترتيب -> لوحة الصدارة وتوب أساطير السيرفر\n` +
                             `• .أرقام هدايا -> استلام الجائزة والراتب اليومي للألعاب\n\n` +
                             `🤖 *[5] ARTIFICIAL INTELLIGENCE & UTILS*\n` +
                             `• .ذكاء [السؤال] -> المحادثة المباشرة مع كاكاشي GPT\n` +
                             `• .رسم [الوصف] -> توليد ورسم صور احترافية بالذكاء\n` +
                             `• .تطبيق [الاسم] -> جلب وتحميل برامج الأندرويد APK\n\n` +
                             `-------------------------------------------\n` +
                             `🔗 OFFICIAL CHANNEL:\n${CHANNEL_LINK}\n\n` +
                             `👉 اكتب (.نقابة تأكيد) لتفعيل الأوامر المقفلة بعد الانضمام للقناة.`;
            return await client.sendMessage(m.chat, { text: menuText, mentions: [userId] }, { quoted: m });
        }

        // =========================================================================
        // 🔒 [حماية القفل الإجباري وقفل التحقق برابط القناة]
        // =========================================================================
        if (command === 'نقابة' && (args[0] === 'تأكيد' || args[0] === 'تاكيد')) {
            user.joinedChannel = true;
            return await client.sendMessage(m.chat, { text: '✅ [SUCCESS] تم تفعيل حسابك، يمكنك الاستمتاع بكافة الألعاب الآن!' }, { quoted: m });
        }

        const restrictedCommands = ['فيديو', 'العاب', 'ذكاء', 'رسم', 'تطبيق', 'أرقام'];
        if (restrictedCommands.includes(command) && !user.joinedChannel && !isOwner) {
            const blockText = `📢 *[LOCK SYSTEM] الأوامر مقفلة برابط القناة!* 📢\n\n` +
                              `⚠️ للعب واستخدام البوت، تابع القناة الرسمية على الواتساب أولاً:\n🔗 ${CHANNEL_LINK}\n\n` +
                              `👉 بعد المتابعة، اكتب الأمر التالي لتفعيل البوت فوراً:\n*.نقابة تأكيد*`;
            return await client.sendMessage(m.chat, { text: blockText }, { quoted: m });
        }

        // =========================================================================
        // 🎬 [2] ميزة تشغيل وتحميل الفيديوهات (.فيديو)
        // =========================================================================
        if (command === 'فيديو') {
            const videoUrl = args.join(' ');
            if (!videoUrl) return await client.sendMessage(m.chat, { text: '⚠️ اكتب رابط الفيديو بعد الأمر!' }, { quoted: m });

            await client.sendMessage(m.chat, { text: '⏳ DOWNLOADING VIDEO... يرجى الانتظار...' }, { quoted: m });
            try {
                const res = await axios.get(`https://eu.org{encodeURIComponent(videoUrl)}&apikey=XYZ`);
                const downloadUrl = res.data?.result?.video || videoUrl;

                await client.sendMessage(m.chat, {
                    video: { url: downloadUrl },
                    caption: '🎬 SUCCESS | تم تشغيل الفيديو بواسطة بوت كاكاشي',
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } catch {
                await client.sendMessage(m.chat, { video: { url: videoUrl }, caption: '🎬 SUCCESS (DIRECT)' }, { quoted: m });
            }
        }

        // =========================================================================
        // 🎮 [3] قسم ألعاب الصور والزواج العشوائي (.العاب)
        // =========================================================================
        if (command === 'العاب' || command === 'لعبة') {
            const gameType = args[0];
            const groupMetadata = m.chat.endsWith('@g.us') ? await client.groupMetadata(m.chat) : null;

            if (gameType === 'زواج' || gameType === 'اتزوج') {
                if (!groupMetadata) return await client.sendMessage(m.chat, { text: '❌ للجروبات فقط!' }, { quoted: m });
                const members = groupMetadata.participants.map(p => p.id);
                
                const husband = members[Math.floor(Math.random() * members.length)];
                let wife = members[Math.floor(Math.random() * members.length)];
                while (husband === wife) wife = members[Math.floor(Math.random() * members.length)];

                let pfp;
                try { pfp = await client.profilePictureUrl(husband, 'image'); } 
                catch { pfp = 'https://telegra.ph'; }

                const wedText = `💍 *إعلان زواج ملكي في الجروب!* 💍\n\n👑 العريس: @${husband.split('@')[0]}\n👰 العروس: @${wife.split('@')[0]}\n\n🎉 ألف مبروك للزوجين السعيدين!`;
                return await client.sendMessage(m.chat, { image: { url: pfp }, caption: wedText, mentions: [husband, wife] }, { quoted: m });
            }

            if (gameType === 'خمن' || gameType === 'صورة') {
                const games = [
                    { url: 'https://unsplash.com', ans: 'اسد' },
                    { url: 'https://unsplash.com', ans: 'قطة' }
                ];
                const rGame = games[Math.floor(Math.random() * games.length)];
                return await client.sendMessage(m.chat, { image: { url: rGame.url }, caption: `🧩 *لعبة خمن ما في الصورة!*\n\n🤔 ماذا ترى في الصورة؟\n💡 الإجابة السرية المخفية هي: || ${rGame.ans} ||` }, { quoted: m });
            }
        }

        // =========================================================================
        // ⚔️ [4] قسم إدارة النقابات والعصابات (.نقابة)
        // =========================================================================
        if (command === 'نقابة') {
            const sub = args[0];
            const name = args.slice(1).join(' ');

            if (sub === 'إنشاء' || sub === 'انشاء') {
                if (!name) return m.reply('⚠️ اكتب اسم النقابة الجديدة!');
                if (global.db.guilds[name]) return m.reply('❌ الاسم مأخوذ مسبقاً!');
                
                global.db.guilds[name] = { owner: userId, members: [userId], level: 1, points: 0 };
                return m.reply(`🎉 تم تأسيس نقابة [ ${name} ] بنجاح، أنت القائد الآن!`);
            }

            if (sub === 'انضمام') {
                if (!name || !global.db.guilds[name]) return m.reply('❌ النقابة غير موجودة!');
                global.db.guilds[name].members.push(userId);
                return m.reply(`⚔️ تم انضمامك بنجاح لنقابة [ ${name} ]!`);
            }

            if (sub === 'قائمتي') {
                let uGuild = Object.keys(global.db.guilds).find(k => global.db.guilds[k].members.includes(userId));
                if (!uGuild) return m.reply('⚠️ أنت لست منضماً لأي نقابة!');
                
                const g = global.db.guilds[uGuild];
                return m.reply(`📊 *نقابة: [ ${uGuild} ]*\n👑 القائد: @${g.owner.split('@')[0]}\n⭐ المستوى: ${g.level}\n👥 الأعضاء: ${g.members.length} لاعب`);
            }
        }

                
