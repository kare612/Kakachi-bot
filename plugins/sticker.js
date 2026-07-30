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
            await sock.sendMessage(chatJid, { text: '⏳ *جاري معالجة وإرسال الملصق فوراً...*' }, { quoted: msg });
            
            // 1. تحميل بافر الصورة من رسالة الواتساب
            const targetMessage = isDirectImage ? msg.message.imageMessage : quotedMessage.imageMessage;
            const stream = await downloadContentFromMessage(targetMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. استخدام محول ميديا مستقر ومفتوح يمنع الفراغات تماماً عبر بروتوكول تحويل الصور المتوافق
            const base64 = buffer.toString('base64');
            const res = await axios.post('https://shizoka.xyz', {
                img: `data:image/jpeg;base64,${base64}`
            }, { responseType: 'arraybuffer' }).catch(async () => {
                return await axios.post('https://violetics.xyz', {
                    img: `data:image/jpeg;base64,${base64}`
                }, { responseType: 'arraybuffer' });
            });

            const finalSticker = Buffer.from(res.data, 'binary');

            // 3. الإرسال الصارم كملصق مع تحديد الـ Mimetype لفرض عرضه على الهواتف
            await sock.sendMessage(chatJid, { 
                sticker: finalSticker,
                mimetype: 'image/webp'
            }, { quoted: msg });

        } catch (error) {
            console.error("خطأ أثناء معالجة الملصق:", error);
            await sock.sendMessage(chatJid, { text: '❌ واجه البوت مشكلة في التوافق أثناء العرض الفوري للملصق.' }, { quoted: msg });
        }
    }
};
