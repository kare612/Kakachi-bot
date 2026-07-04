// ذاكرة محلية لحفظ بيانات شخصيات الأعضاء (المستوى، الطاقة، الذهب، الانتصارات)
global.ninjaDatabase = global.ninjaDatabase || {};

module.exports = {
    name: 'المدرب',
    run: async (sock, from, msg, args, commandName) => {
        const isGroup = from.endsWith('@g.us');
        if (!isGroup) return sock.sendMessage(from, { text: "❌ هذا النظام الأسطوري مخصص للجروبات ونقابات القتال فقط!" }, { quoted: msg });

        const sender = msg.key.participant;
        
        // إنشاء ملف شخصية جديد إذا كان العضو يستخدم النظام لأول مرة
        if (!global.ninjaDatabase[sender]) {
            global.ninjaDatabase[sender] = {
                level: 1,
                xp: 0,
                gold: 100,
                power: 50,
                wins: 0
            };
        }

        const profile = global.ninjaDatabase[sender];

        // 1. أمر إنشاء وتفقد بطاقة الشخصية الأسطورية (.شخصيتي)
        if (commandName === 'شخصيتي' || commandName === 'القتال') {
            const statusLayout = `
💥 ━━━━━━ 🥷 *مَـلَـف الـشِّـيـنُـوبِـي الأُسْـطُـورِي* 🥷 ━━━━━━ 💥

👤 *الـمُـحـارب:* @${sender.split('@')[0]}
📊 *الـمُـسـتـوَى (Level):* [ ${profile.level} ]
✨ *نقاط الخبرة (XP):* [ ${profile.xp} / ${profile.level * 100} ]
⚔️ *قوة الهجوم (Power):* [ 🛡️ ${profile.power} ]
💰 *الذهب الملكي (Gold):* [ 🪙 ${profile.gold} ]
🏆 *الانتصارات في المعارك:* [ 👑 ${profile.wins} ]

💥 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 💥
💡 *الأوامر المتاحة:*
» \`.تدريب\` (لرفع قوتك وجمع الذهب)
» \`.تحدي\` [تاغ لعضو] (لبدء معركة طاحنة)`;

            return sock.sendMessage(from, { text: statusLayout, mentions: [sender] }, { quoted: msg });
        }

        // 2. أمر التدريب اليومي لجمع الذهب والـ XP (.تدريب)
        if (commandName === 'تدريب' || commandName === 'train') {
            const gainedXp = Math.floor(Math.random() * 30) + 15;
            const gainedGold = Math.floor(Math.random() * 50) + 20;
            const gainedPower = Math.floor(Math.random() * 5) + 2;

            profile.xp += gainedXp;
            profile.gold += gainedGold;
            profile.power += gainedPower;

            // نظام رفع المستوى تلقائياً عند امتلاء الـ XP
            let leveledUp = false;
            if (profile.xp >= profile.level * 100) {
                profile.xp = 0;
                profile.level += 1;
                profile.power += 15; // مكافأة ليفل أب
                leveledUp = true;
            }

            let trainText = `🎯 *﹝ نَـتِـيـجَـة الـتَّـدْرِيـب الأُسْـطُـورِي ﹞*\n\n`;
            trainText += `🥷 لقد خضت تدريباً شاقاً في غابة كاكاشي وحصلت على:\n`;
            trainText += `✨ *خبرة:* +${gainedXp} XP\n`;
            trainText += `🪙 *ذهب:* +${gainedGold} غولد\n`;
            trainText += `⚔️ *قوة إضافية:* +${gainedPower}\n`;

            if (leveledUp) {
                trainText += `\n🔥 *مُـذْهِـل! ارتقيت إلى المستوى الجديد: [ ${profile.level} ]* 🎉`;
            }

            return sock.sendMessage(from, { text: trainText }, { quoted: msg });
        }

        // 3. أمر التحدي والقتال بين أعضاء الجروب (.تحدي)
        if (commandName === 'تحدي' || commandName === 'قتال') {
            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!mentioned) return sock.sendMessage(from, { text: "❌ يجب أن تقوم بعمل تاغ (منشن) للشخص الذي تريد قتاله وتحديه!\nمثال: .تحدي @عضو" }, { quoted: msg });
            if (mentioned === sender) return sock.sendMessage(from, { text: "❌ لا يمكنك قتال نفسك يا بطل!" }, { quoted: msg });

            // إنشاء ملف الخصم إن لم يكن لديه حساب
            if (!global.ninjaDatabase[mentioned]) {
                global.ninjaDatabase[mentioned] = { level: 1, xp: 0, gold: 100, power: 50, wins: 0 };
            }
            const targetProfile = global.ninjaDatabase[mentioned];

            // حساب فرصة الفوز بناءً على القوة (مع عامل عشوائي للحماس)
            const myChance = profile.power + Math.floor(Math.random() * 50);
            const targetChance = targetProfile.power + Math.floor(Math.random() * 50);

            await sock.sendMessage(from, { text: `⚔️ *بَدَأَتِ الْمَعْرَكَةُ الطَّاحِنَةُ الآنَ!* \n@${sender.split('@')[0]} ضد @${mentioned.split('@')[0]}...\nجاري حساب ضربات الشينوبي القاضية...` , mentions: [sender, mentioned]}, { quoted: msg });

            setTimeout(async () => {
                let winner, loser, wonGold;

                if (myChance >= targetChance) {
                    winner = sender;
                    loser = mentioned;
                    profile.wins += 1;
                    wonGold = Math.floor(targetProfile.gold * 0.2); // الفائز يأخذ 20% من ذهب الخصم
                    profile.gold += wonGold;
                    targetProfile.gold -= wonGold;
                } else {
                    winner = mentioned;
                    loser = sender;
                    targetProfile.wins += 1;
                    wonGold = Math.floor(profile.gold * 0.2);
                    targetProfile.gold += wonGold;
                    profile.gold -= wonGold;
                }

                const battleResult = `
🏆 ━━━━━━ 🌟 *نَـتِـيـجَـة مَـعْـرَكَـة كَـاكَـاشِـي* 🌟 ━━━━━━ 🏆

⚔️ بعد قتال عنيف حبس الأنفاس واستخدام مهارات النينجا السرية:
👑 *الْـفَـائِـزُ الأُسْـطُـورِي:* @${winner.split('@')[0]}
💀 *الْـخَـاسِـرُ الْـمَـهْـزُومُ:* @${loser.split('@')[0]}

💰 *الغنائم المستولى عليها:* [ 🪙 ${wonGold} ذهب ] 

🏆 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🏆`;

                await sock.sendMessage(from, { text: battleResult, mentions: [winner, loser] });
            }, 3000); // إظهار النتيجة بعد 3 ثوانٍ من الحماس التشويقي
        }
    }
};            // توجيه أوامر اللعبة الأسطورية الجديدة إلى ملف المدرب
            let commandFile;
            if (['شخصيتي', 'القتال', 'تدريب', 'تحدي', 'قتال'].includes(commandName)) {
                commandFile = path.join(__dirname, 'commands', 'المدرب.js');
            } else {
                commandFile = path.join(__dirname, 'commands', `${commandName}.js`);
            }

            if (fs.existsSync(commandFile)) {
                const command = require(commandFile);
                await command.run(sock, from, msg, args, commandName);
            }

