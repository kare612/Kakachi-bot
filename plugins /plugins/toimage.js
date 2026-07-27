// كود ميزة تحويل الملصقات إلى صور لبوت كاكاشي
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    name: 'لصورة',
    alias: ['صورة', 'toimage', 'img', 'تحويل_ملصق'],
    category: 'tools',
    desc: 'تحويل ملصقات الواتساب (Stickers) إلى صور عادية بجودة كاملة',
    async execute(client, m) {
        // 1. التحقق مما إذا كان المستخدم قد أشار إلى ملصق أو أرسل ملصقاً مع الأمر
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!/webp/.test(mime)) {
            return await client.sendMessage(m.chat, { 
                text: '⚠️ يرجى الإشارة (Reply) إلى الملصق الذي تريد تحويله إلى صورة، ثم اكتب الأداة: *.لصورة*' 
            }, { quoted: m });
        }

        try {
            // 2. إرسال رسالة جاري التحويل
            await client.sendMessage(m.chat, { text: '🔄 جاري تحميل وتحويل الملصق إلى صورة، يرجى الانتظار...' }, { quoted: m });

            // 3. تحميل بافر (Buffer) الملصق من سيرفرات الواتساب
            const buffer = await downloadMediaMessage(
                quoted,
                'buffer',
                {},
                { logger: console }
            );

            // إعداد مسارات الملفات المؤقتة في السيرفر لعمل المعالجة
            const filename = `sticker_${Date.now()}`;
            const inputWebp = path.join(__dirname, `../tmp/${filename}.webp`);
            const outputPng = path.join(__dirname, `../tmp/${filename}.png`);

            // التأكد من وجود مجلد tmp
            if (!fs.existsSync(path.join(__dirname, '../tmp'))) {
                fs.mkdirSync(path.join(__dirname, '../tmp'));
            }

            // كتابة بافر الملصق كملف مؤقت بصيغة webp
            fs.writeFileSync(inputWebp, buffer);

            // 4. استخدام أداة ffmpeg المثبتة في Termux لتحويل صيغة الملصق إلى صورة ثابتة بدقة
            exec(`ffmpeg -i ${inputWebp} ${outputPng}`, async (error) => {
                if (error) {
                    console.error("خطأ أثناء تحويل الصورة بـ ffmpeg:", error);
                    return await client.sendMessage(m.chat, { text: '❌ عذراً، فشل تحويل الملصق. تأكد من تثبيت حزمة ffmpeg في ترمكس.' }, { quoted: m });
                }

                // 5. إرسال الصورة الناتجة مباشرة إلى دردشة المستخدم
                await client.sendMessage(m.chat, {
                    image: fs.readFileSync(outputPng),
                    caption: '📸 تم تحويل الملصق الخاص بك إلى صورة بجودة عالية بنجاح!'
                }, { quoted: m });

                // 6. تنظيف وحذف الملفات المؤقتة فوراً لتوفير مساحة الهاتف
                if (fs.existsSync(inputWebp)) fs.unlinkSync(inputWebp);
                if (fs.existsSync(outputPng)) fs.unlinkSync(outputPng);
            });

        } catch (err) {
            console.error("خطأ عام في الأمر:", err);
            await client.sendMessage(m.chat, { text: '❌ حدث خطأ غير متوقع أثناء معالجة الملصق.' }, { quoted: m });
        }
    }
};
