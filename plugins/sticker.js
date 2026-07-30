import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';

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

        try {
            await sock.sendMessage(chatJid, { text: '⏳ *جاري تحويل الصورة ومعالجتها محلياً إلى ملصق...*' }, { quoted: msg });
            
            // 1. جلب بيانات الصورة وتحميلها كـ Buffer
            const targetMessage = isDirectImage ? msg.message.imageMessage : quotedMessage.imageMessage;
            const stream = await downloadContentFromMessage(targetMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. استخدام مكتبة sharp لمعالجة الصورة وتحويل أبعادها وصيغتها لتوافق الواتساب تماماً
            const stickerBuffer = await sharp(buffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // خلفية شفافة للملصق
                })
                .webp() // تحويل صيغة الصورة إلى WebP المطلوبة للملصقات
                .toBuffer();

            // 3. إرسال الملصق الجاهز والمكتمل للواتساب
            await sock.sendMessage(chatJid, { sticker: stickerBuffer }, { quoted: msg });

        } catch (error) {
            console.error("خطأ في معالجة الملصق عبر sharp:", error);
            await sock.sendMessage(chatJid, { text: '❌ حدث خطأ داخلي أثناء معالجة الملصق محلياً.' }, { quoted: msg });
        }
    }
};
