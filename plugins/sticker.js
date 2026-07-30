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
            await sock.sendMessage(chatJid, { text: '⏳ *جاري تحويل الصورة ومعالجتها إلى ملصق مكتمل...*' }, { quoted: msg });
            
            // 1. تحميل بافر الصورة من رسالة الواتساب
            const targetMessage = isDirectImage ? msg.message.imageMessage : quotedMessage.imageMessage;
            const stream = await downloadContentFromMessage(targetMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. تجهيز البيانات وإرسالها إلى API مطور يقوم بالتحويل وحقن الميتا داتا تلقائياً
            const form = new FormData();
            form.append('file', buffer, { filename: 'sticker.jpg', contentType: 'image/jpeg' });

            const response = await axios.post('https://boxpro.dev', form, {
                headers: {
                    ...form.getHeaders(),
                    'Accept': 'application/json'
                },
                responseType: 'arraybuffer'
            }).catch(async () => {
                // سيرفر احتياطي دائم في حال حدوث أي ضغط على السيرفر الأول
                return await axios.post('https://dify.ai', form, {
                    headers: form.getHeaders(),
                    responseType: 'arraybuffer'
                });
            });

            const stickerBuffer = Buffer.from(response.data, 'binary');

            // 3. إرسال الملصق النهائي المكتمل إلى المحادثة
            await sock.sendMessage(chatJid, { sticker: stickerBuffer }, { quoted: msg });

        } catch (error) {
            console.error("خطأ أثناء معالجة الملصق:", error);
            await sock.sendMessage(chatJid, { text: '❌ حدث خطأ أثناء معالجة وحفظ بيانات الملصق، يرجى المحاولة مرة أخرى.' }, { quoted: msg });
        }
    }
};
