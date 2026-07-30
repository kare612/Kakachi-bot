import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import axios from 'axios';
import FormData from 'form-data';

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
            await sock.sendMessage(chatJid, { text: '⏳ *جاري تحويل الصورة ومعالجتها إلى ملصق...*' }, { quoted: msg });
            
            // 1. جلب بيانات الصورة وتحميلها كـ Buffer
            const targetMessage = isDirectImage ? msg.message.imageMessage : quotedMessage.imageMessage;
            const stream = await downloadContentFromMessage(targetMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. تحويل الصورة إلى تنسيق Webp مدعوم عبر API مجاني لضمان ظهورها
            const formData = new FormData();
            formData.append('file', buffer, 'image.jpg');

            const response = await axios.post('https://ezgif.com', formData, {
                headers: formData.getHeaders(),
                responseType: 'arraybuffer'
            }).catch(async () => {
                // سيرفر احتياطي في حال توقف الأول
                return await axios.post('https://w3cub.com', formData, {
                    headers: formData.getHeaders(),
                    responseType: 'arraybuffer'
                });
            });

            const stickerBuffer = Buffer.from(response.data, 'binary');

            // 3. إرسال الملصق الجاهز والمكتمل للواتساب
            await sock.sendMessage(chatJid, { sticker: stickerBuffer }, { quoted: msg });

        } catch (error) {
            console.error("خطأ في معالجة الملصق:", error);
            // حل احتياطي: إذا فشل السيرفر يتم إرسال البافر العادي
            try {
                const targetMessage = isDirectImage ? msg.message.imageMessage : quotedMessage.imageMessage;
                const stream = await downloadContentFromMessage(targetMessage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
                await sock.sendMessage(chatJid, { sticker: buffer }, { quoted: msg });
            } catch (err) {
                await sock.sendMessage(chatJid, { text: '❌ حدث خطأ أثناء تحويل الملصق، يرجى المحاولة لاحقاً.' }, { quoted: msg });
            }
        }
    }
};
                                              console.error("خطأ في معالجة الملصق:", error);
            await sock.sendMessage(chatJid, { text: '❌ حدث خطأ أثناء تحويل الصورة إلى ملصق.' }, { quoted: msg });
        }
    }
};
