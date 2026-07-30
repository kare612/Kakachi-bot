import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import axios from 'axios';

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
            await sock.sendMessage(chatJid, { text: '⏳ *جاري تحويل الصورة إلى ملصق...*' }, { quoted: msg });
            
            // 1. جلب بيانات الصورة وتحميلها كـ Buffer
            const targetMessage = isDirectImage ? msg.message.imageMessage : quotedMessage.imageMessage;
            const stream = await downloadContentFromMessage(targetMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. استخدام سيرفر تحويل خارجي آمن وسريع جداً عبر تحويل البافر إلى Base64
            const base64Image = buffer.toString('base64');
            const response = await axios.post('https://repl.co', {
                image: `data:image/jpeg;base64,${base64Image}`
            }, { responseType: 'arraybuffer' }).catch(async () => {
                // سيرفر بديل ثانٍ لضمان العمل التام
                return await axios.post('https://lolhuman.xyz', {
                    img: `data:image/jpeg;base64,${base64Image}`
                }, { responseType: 'arraybuffer' });
            });

            const stickerBuffer = Buffer.from(response.data, 'binary');

            // 3. إرسال الملصق الجاهز والمكتمل للواتساب
            await sock.sendMessage(chatJid, { sticker: stickerBuffer }, { quoted: msg });

        } catch (error) {
            console.error("خطأ في معالجة الملصق عبر السيرفر:", error);
            // حل احتياطي أخير لإرسال البافر مباشرة في حال توقف السيرفرات
            try {
                const targetMessage = isDirectImage ? msg.message.imageMessage : quotedMessage.imageMessage;
                const stream = await downloadContentFromMessage(targetMessage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
                await sock.sendMessage(chatJid, { sticker: buffer }, { quoted: msg });
            } catch (err) {
                await sock.sendMessage(chatJid, { text: '❌ حدث خطأ، يرجى المحاولة لاحقاً.' }, { quoted: msg });
            }
        }
    }
};
