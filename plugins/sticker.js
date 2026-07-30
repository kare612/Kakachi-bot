import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default {
    command: ['ملصق', 'sticker', 'سلوق'],
    category: 'tools',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        const quotedMessage = contextInfo?.quotedMessage;

        const isDirectImage = msg.message?.imageMessage;
        const isQuotedImage = quotedMessage?.imageMessage;

        if (!isDirectImage && !isQuotedImage) {
            return await sock.sendMessage(chatJid, { 
                text: '❌ *خطأ:* يرجى إرسال صورة مع كتابة أمر *.ملصق* أو الرد على صورة موجودة مسبقاً!' 
            }, { quoted: msg });
        }

        // مسارات عشوائية ومؤقتة لحفظ الصور داخل جهازك لمعالجتها
        const tmpInput = path.join(process.cwd(), `tmp_input_${Date.now()}.jpg`);
        const tmpOutput = path.join(process.cwd(), `tmp_output_${Date.now()}.webp`);

        try {
            await sock.sendMessage(chatJid, { text: '⏳ *جاري توليد الملصق محلياً بسرعة فائقة...*' }, { quoted: msg });
            
            // 1. تحميل بافر الصورة من رسالة الواتساب
            const targetMessage = isDirectImage ? msg.message.imageMessage : quotedMessage.imageMessage;
            const stream = await downloadContentFromMessage(targetMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. حفظ ملف الصورة مؤقتاً في نظام التشغيل
            await fs.promises.writeFile(tmpInput, buffer);

            // 3. تحويل الصورة إلى ملصق ويب بي محلياً باستخدام أداة النظام ffmpeg المدمجة بدون روابط خارجية
            await execPromise(`ffmpeg -i "${tmpInput}" -vcodec libwebp -vf "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(512-iw)/2:(512-ih)/2:color=white@0" -lossless 1 "${tmpOutput}"`);

            const finalSticker = await fs.promises.readFile(tmpOutput);

            // 4. الإرسال الفوري كملصق متوافق مع كافة الهواتف والأنظمة
            await sock.sendMessage(chatJid, { 
                sticker: finalSticker,
                mimetype: 'image/webp'
            }, { quoted: msg });

        } catch (error) {
            console.error("خطأ أثناء معالجة الملصق:", error);
            await sock.sendMessage(chatJid, { text: '❌ واجه البوت مشكلة في المعالجة المحلية، يرجى التأكد من تثبيت حزمة ffmpeg.' }, { quoted: msg });
        } finally {
            // تنظيف وحذف الملفات المؤقتة من الجهاز للحفاظ على المساحة
            if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
            if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
        }
    }
};
