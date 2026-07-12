// إعدادات البوت الأساسية ورقم هاتف المالك
const OWNER_NUMBER = "212784776925@s.whatsapp.net"; 

// دالة لجلب الزخرفة من الـ API (تستخدم موقع زغرفة مجاني ومفتوح)
const axios = require('axios');

async function getZakhrafa(text) {
    try {
        // يتم استخدام API لتوليد النصوص المزخرفة تلقائياً
        const response = await axios.get(`https://vhtear.com{encodeURIComponent(text)}`);
        return response.data.result || text;
    } catch (error) {
        // إذا فشل الـ API يتم استخدام زخرفة يدوية بسيطة كبديل لإصلاح الأخطاء
        return `✨ 『 ${text} 』 ✨`;
    }
}

async function handleCommand(sock, msg, command, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const isOwner = sender.includes("212784776925");

    switch (command) {
        case 'اوامر':
        case 'الاوامر':
        case 'menu':
            const menuText = `*⚡ قائمة أوامر بوت كاكاشي ⚡*\n\n` +
                             `• *.زخرف [النص]* : لزخرفة النصوص عبر الـ API\n` +
                             `• *.فيديو [اسم الأغنية]* : لتحميل فيديو من اليوتيوب\n` +
                             `• *.صوت [اسم الأغنية]* : لتحميل صوت من اليوتيوب\n\n` +
                             `• *.فحص* : للتأكد من أن البوت يعمل بنشاط`;
            await sock.sendMessage(from, { text: menuText }, { quoted: msg });
            break;

        case 'زخرف':
        case 'زخرفة':
            if (!args[0]) return await sock.sendMessage(from, { text: '❌ يرجى كتابة النص المراد زخرفته! مثال: .زخرف كاكاشي' }, { quoted: msg });
            const textToDecorate = args.join(' ');
            const decorated = await getZakhrafa(textToDecorate);
            await sock.sendMessage(from, { text: decorated }, { quoted: msg });
            break;

        case 'فحص':
            if (!isOwner) return await sock.sendMessage(from, { text: '❌ هذا الأمر خاص بمالك البوت فقط!' }, { quoted: msg });
            await sock.sendMessage(from, { text: '✅ البوت يعمل بنجاح والاتصال مستقر يا زعيم!' }, { quoted: msg });
            break;

        default:
            // أمر غير معروف
            break;
    }
}

module.exports = { handleCommand };
