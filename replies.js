const fs = require('fs');
const path = require('path');

// تحديد مسار مجلد الأوامر الظاهر في صورتك
const commandsFolder = path.join(__dirname, 'الأوامر');

async function handleMessage(sock, msg) {
    try {
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || 
                     (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) || '';
                     
        if (!body.startsWith('.')) return; // يجب أن يبدأ الأمر بنقطة
        
        // تفكيك النص: استخراج اسم الأمر والمرفقات
        const args = body.trim().split(/ +/);
        const commandName = args.shift().toLowerCase().replace('.', ''); // اسم الأمر بدون النقطة

        // قراءة الملفات داخل مجلد "الأوامر" والدخول إليها
        if (fs.existsSync(commandsFolder)) {
            const files = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
            
            let commandFound = false;

            for (const file of files) {
                const commandFile = require(path.join(commandsFolder, file));
                
                // التأكد من أن الأمر يطابق اسم الملف أو الاختصارات المحددة بداخل ملف الأمر
                if (commandFile.name === commandName || (commandFile.aliases && commandFile.aliases.includes(commandName))) {
                    await commandFile.execute(sock, msg, args);
                    commandFound = true;
                    break;
                }
            }

            if (!commandFound && commandName === 'اوامر') {
                // إذا كتب ".اوامر" يقرأ أسماء الملفات تلقائياً ويعرضها كقائمة
                const list = files.map(f => `• .${f.replace('.js', '')}`).join('\n');
                await sock.sendMessage(from, { text: `⚡ *قائمة أوامر بوت كاكاشي المستخرجة:* ⚡\n\n${list}` }, { quoted: msg });
            }
        }

    } catch (err) {
        console.error('خطأ أثناء الدخول للمجلد وتشغيل الأمر:', err);
    }
}

module.exports = { handleMessage };
