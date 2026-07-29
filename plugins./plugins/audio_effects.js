import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'تعديل_صوت',
    alias: ['سنجاب', 'عميق', 'روبوت', 'بطيء', 'سريع'],
    category: 'user',
    async execute(client, msg, args) {
        const chatJid = msg.key.remoteJid;

        // التحقق من أن المستخدم قام بعمل ريبلاي (رد) على رسالة صوتية
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg || (!quotedMsg.audioMessage && !quotedMsg.voiceMessage)) {
            return await client.sendMessage(chatJid, { 
                text: '⚠️ *تنبيه:* يرجى الرد (Reply) على أي رسالة صوتية أو ريكورد باستخدام أحد الأوامر التالية:\n\n• `.سنجاب` ¦ صوت حاد وسريع.\n• `.عميق` ¦ صوت رجل ضخم وعريض.\n• `.روبوت` ¦ تأثير صوت آلي ونبرة معدنية.\n• `.بطيء` ¦ تبطيء سرعة الصوت.\n• `.سريع` ¦ تسريع التسجيل.' 
            }, { quoted: msg });
        }

        // تحديد نوع التأثير الصوتي بناءً على الكلمة المستعملة خلف النقطة
        const body = msg.message.extendedTextMessage.text.toLowerCase();
        let ffmpegFilter = '';

        if (body.includes('سنجاب')) {
            ffmpegFilter = '-filter:a "asetrate=22100*1.25,atarah=1.25"';
        } else if (body.includes('عميق')) {
            ffmpegFilter = '-filter:a "asetrate=22100*0.75,atarah=0.75"';
        } else if (body.includes('روبوت')) {
            ffmpegFilter = '-filter:a "fanger=delay=5:depth=0.8"';
        } else if (body.includes('بطيء')) {
            ffmpegFilter = '-filter:a "atempo=0.7"';
        } else if (body.includes('سريع')) {
            ffmpegFilter = '-filter:a "atempo=1.5"';
        }

        const status = await client.sendMessage(chatJid, { text: '⏳ جاري معالجة الصوت وتطبيق التأثير...' }, { quoted: msg });

        try {
            // تحميل وتحميل ملف الصوت الأصلي من خوادم الواتساب
            const stream = await downloadContentFromMessage(quotedMsg.audioMessage, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // إنشاء ملفات مؤقتة للمعالجة والتحويل
            const inputPath = path.join(process.cwd(), `input_${Date.now()}.ogg`);
            const outputPath = path.join(process.cwd(), `output_${Date.now()}.ogg`);

            fs.writeFileSync(inputPath, buffer);

            // تشغيل أداة FFmpeg لتغيير نبرة الصوت وتحويله إلى صيغة Opus المتوافقة مع الواتساب
            exec(`ffmpeg -i ${inputPath} ${ffmpegFilter} -c:a libopus ${outputPath}`, async (error) => {
                if (error) {
                    throw error;
                }

                const finalAudio = fs.readFileSync(outputPath);

                // إرسال الصوت المعدل على شكل تسجيل صوتي (ريكورد مباشر)
                await client.sendMessage(chatJid, { 
                    audio: finalAudio, 
                    mimetype: 'audio/ogg; codecs=opus', 
                    ptt: true 
                }, { quoted: msg });

                // تنظيف وحذف الملفات المؤقتة من ذاكرة الخادم
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
                await client.sendMessage(chatJid, { delete: status.key });
            });

        } catch (err) {
            console.error('خطأ أثناء تحويل نبرة الصوت:', err);
            await client.sendMessage(chatJid, { text: '❌ تعذر تعديل الصوت، تأكد من سلامة الملف الصوتي وجرب مجدداً.' }, { quoted: msg });
        }
    }
};
