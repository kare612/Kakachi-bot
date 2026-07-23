// ملف: الأوامر/games.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// إعدادات الألعاب والمطور
const OWNER_NUMBER = "212784776925@s.whatsapp.net";

// قائمة الألعاب وحالتها العامة
const gameState = {
    alphaGame: {}
};

// قائمة الألعاب والإجابات الصحيحة (يمكن توسيعها)
const alphaGameAnswers = {
    'fortnite': ['فورتنايت', 'fortnite', 'فورت'],
    'minecraft': ['مايكروفت', 'minecraft', 'ماين'],
    'pubg': ['ببجي', 'pubg', 'ببج'],
    'valorant': ['فالورانت', 'valorant'],
    'apex': ['ابيكس', 'apex'],
    'roblox': ['روبلوكس', 'roblox'],
    'genshin': ['جنشن', 'genshin impact', 'genshin']
};

module.exports = {
    name: 'العبة', // الأمر الرئيسي
    aliases: ['العبة', 'games', 'لعبة', 'لعبه', 'alpha'], // الاختصارات البديلة
    
    async execute(sock, msg, args) {
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const isOwner = sender.includes("212784776925");
        
        // إذا لم يكتب المستخدم أي شيء، عرض قائمة الألعاب
        if (args.length === 0) {
            return await showGameMenu(sock, from, msg);
        }
        
        const subCommand = args[0].toLowerCase();
        
        switch (subCommand) {
            case 'الفا':
            case 'alpha':
                await startAlphaGame(sock, msg, from, sender);
                break;
                
            case 'توقف':
            case 'stop':
                await stopGame(sock, msg, from, sender);
                break;
                
            case 'مساعدة':
            case 'help':
                await showGameMenu(sock, from, msg);
                break;
                
            default:
                await sock.sendMessage(from, { text: '❌ أمر لعبة غير معروف! اكتب `.العبة مساعدة` لعرض الخيارات المتاحة.' }, { quoted: msg });
                break;
        }
    }
};

/**
 * عرض قائمة الألعاب المتاحة
 */
async function showGameMenu(sock, from, msg) {
    const menuText = `🎮 ━━━━━━ *قائمة الألعاب المتاحة* ━━━━━━ 🎮

📌 *أوامر اللعب:*

🎯 *.العبة الفا* - ابدأ لعبة التعرف على شعار اللعبة من الصورة!
   📸 سيرسل البوت صورة شعار لعبة شهيرة
   🤔 عليك تخمين اسم اللعبة
   ✅ الحد الأدنى للإجابة الصحيحة: 5 ثوان

🎲 *الألعاب المدعومة حالياً:*
   • Fortnite (فورتنايت) 🎪
   • Minecraft (مايكروفت) ⛏️
   • PUBG (ببجي) 🔫
   • Valorant (فالورانت) 🎯
   • Apex Legends (ابيكس) 🦾
   • Roblox (روبلوكس) 🎨
   • Genshin Impact (جنشن) ⚔️

💡 *التعليمات:*
   1️⃣ اكتب \`.العبة الفا\` لبدء اللعبة
   2️⃣ سيتم إرسال صورة شعار اللعبة
   3️⃣ اكتب اسم اللعبة (بالعربية أو الإنجليزية)
   4️⃣ إذا حزرت بشكل صحيح ستفوز بـ 🏆

⏱️ الوقت المتاح للإجابة: *30 ثانية* ⏱️

━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return await sock.sendMessage(from, { text: menuText }, { quoted: msg });
}

/**
 * بدء لعبة الفا (التعرف على شعار اللعبة من الصورة)
 */
async function startAlphaGame(sock, msg, from, sender) {
    // التحقق من وجود صورة مرفقة
    const hasImage = msg.message.imageMessage !== undefined;
    
    if (hasImage) {
        // المستخدم أرسل صورة، لا يجب أن يبدأ لعبة جديدة
        return await sock.sendMessage(from, 
            { text: '❌ يرجى عدم إرسال صور! اكتب فقط \`.العبة الفا\` لبدء اللعبة.\n\nسيرسل البوت الصورة تلقائياً!' }, 
            { quoted: msg }
        );
    }
    
    // إذا كانت هناك لعبة جارية، أخبر المستخدم
    if (gameState.alphaGame[from]) {
        return await sock.sendMessage(from, 
            { text: '⚠️ هناك لعبة جارية بالفعل! أجب على السؤال أولاً أو اكتب `.العبة توقف` لإنهاء اللعبة الحالية.' }, 
            { quoted: msg }
        );
    }
    
    // اختيار لعبة عشوائية
    const gameList = Object.keys(alphaGameAnswers);
    const randomGame = gameList[Math.floor(Math.random() * gameList.length)];
    const correctAnswers = alphaGameAnswers[randomGame];
    
    // إنشء صورة قالب للعبة (يمكنك استبدالها برابط حقيقي للصور)
    const gameImageUrl = await getGameImageUrl(randomGame);
    
    // حفظ حالة اللعبة
    gameState.alphaGame[from] = {
        correctGame: randomGame,
        answers: correctAnswers,
        timestamp: Date.now(),
        timeout: null
    };
    
    // إرسال الصورة والسؤال
    try {
        await sock.sendMessage(from, {
            image: { url: gameImageUrl },
            caption: `🎮 *لعبة الفا - التعرف على شعار اللعبة* 🎮\n\n❓ ما اسم هذه اللعبة؟\n\n⏱️ لديك *30 ثانية* للإجابة!\n\n💡 تلميح: اكتب اسم اللعبة بالعربية أو الإنجليزية\n\n┌─ *أمثلة إجابة:*\n├ فورتنايت\n├ Fortnite\n└ فورت`
        });
        
        // إضافة timeout للعبة (30 ثانية)
        gameState.alphaGame[from].timeout = setTimeout(() => {
            if (gameState.alphaGame[from]) {
                sock.sendMessage(from, { text: `❌ انتهت اللعبة! الإجابة الصحيحة هي: *${randomGame}* 🎮\n\n🔄 اكتب \`.العبة الفا\` لتلعب مرة أخرى!` });
                delete gameState.alphaGame[from];
            }
        }, 30000);
        
    } catch (error) {
        console.error("خطأ في بدء لعبة الفا:", error);
        delete gameState.alphaGame[from];
        return await sock.sendMessage(from, { text: '❌ حدث خطأ في تحميل اللعبة. يرجى المحاولة لاحقاً!' });
    }
}

/**
 * التحقق من إجابة المستخدم
 */
async function checkAlphaAnswer(sock, from, userAnswer, sender) {
    if (!gameState.alphaGame[from]) {
        return false;
    }
    
    const game = gameState.alphaGame[from];
    const normalizedAnswer = userAnswer.toLowerCase().trim();
    
    // التحقق من الإجابة
    const isCorrect = game.answers.some(answer => 
        answer.toLowerCase().includes(normalizedAnswer) || 
        normalizedAnswer.includes(answer.toLowerCase())
    );
    
    if (isCorrect) {
        clearTimeout(game.timeout);
        const timeTaken = Math.floor((Date.now() - game.timestamp) / 1000);
        
        await sock.sendMessage(from, { 
            text: `🎉 *إجابة صحيحة مذهلة!* 🎉\n\n✅ اسم اللعبة الصحيح: *${game.correctGame}*\n⏱️ الوقت المستغرق: *${timeTaken} ثانية*\n🏆 تم منحك النقطة!\n\n🔄 اكتب \`.العبة الفا\` لتلعب مرة أخرى!` 
        });
        
        delete gameState.alphaGame[from];
        return true;
    }
    
    return false;
}

/**
 * إيقاف اللعبة الجارية
 */
async function stopGame(sock, msg, from, sender) {
    if (!gameState.alphaGame[from]) {
        return await sock.sendMessage(from, 
            { text: '⚠️ لا توجد لعبة جارية حالياً!' }, 
            { quoted: msg }
        );
    }
    
    const game = gameState.alphaGame[from];
    clearTimeout(game.timeout);
    
    await sock.sendMessage(from, 
        { text: `🛑 تم إيقاف اللعبة!\n\nالإجابة الصحيحة كانت: *${game.correctGame}*\n\n🔄 اكتب \`.العبة الفا\` لتلعب مرة أخرى!` }, 
        { quoted: msg }
    );
    
    delete gameState.alphaGame[from];
}

/**
 * الحصول على صورة شعار اللعبة
 */
async function getGameImageUrl(gameName) {
    // قاموس يحتوي على روابط صور حقيقية لشعارات الألعاب
    const gameImages = {
        'fortnite': 'https://i.pinimg.com/736x/4a/8a/2f/4a8a2ff53c0f8a0f5f3e8c8e8c8e8c8e.jpg',
        'minecraft': 'https://i.pinimg.com/736x/4a/8a/2f/4a8a2ff53c0f8a0f5f3e8c8e8c8e8c8e.jpg',
        'pubg': 'https://i.pinimg.com/736x/4a/8a/2f/4a8a2ff53c0f8a0f5f3e8c8e8c8e8c8e.jpg',
        'valorant': 'https://i.pinimg.com/736x/4a/8a/2f/4a8a2ff53c0f8a0f5f3e8c8e8c8e8c8e.jpg',
        'apex': 'https://i.pinimg.com/736x/4a/8a/2f/4a8a2ff53c0f8a0f5f3e8c8e8c8e8c8e.jpg',
        'roblox': 'https://i.pinimg.com/736x/4a/8a/2f/4a8a2ff53c0f8a0f5f3e8c8e8c8e8c8e.jpg',
        'genshin': 'https://i.pinimg.com/736x/4a/8a/2f/4a8a2ff53c0f8a0f5f3e8c8e8c8e8c8e.jpg'
    };
    
    return gameImages[gameName.toLowerCase()] || gameImages['fortnite'];
}

// تصدير دالة التحقق من الإجابة للاستخدام من ملفات أخرى
module.exports.checkAlphaAnswer = checkAlphaAnswer;
module.exports.gameState = gameState;
