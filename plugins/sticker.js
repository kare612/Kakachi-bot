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
            await sock.sendMessage(chatJid, { text: '⏳ *جاري معالجة وإرسال الملصق فوراً...*' }, { quoted: msg });
            
            // 1. تحميل بافر الصورة من رسالة الواتساب
            const targetMessage = isDirectImage ? msg.message.imageMessage : quotedMessage.imageMessage;
            const stream = await downloadContentFromMessage(targetMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. الرفع على سيرفر تليجرام المستقر بدلاً من السيرفرات المتعطلة
            const form = new FormData();
            form.append('file', buffer, { filename: 'sticker.jpg', mimetype: 'image/jpeg' });
            
            const uploadRes = await axios.post('https://telegra.ph', form, {
                headers: form.getHeaders()
            });
            
            const imgUrl = 'https://telegra.ph' + uploadRes.data[0].src;

            // 3. تحويل الرابط إلى ملصق بصيغة WebP
            let res;
            try {
                // السيرفر الأول
                res = await axios.get(`https://lolhuman.xyz{encodeURIComponent(imgUrl)}`, {
                    responseType: 'arraybuffer'
                });
            } catch {
                // السيرفر الاحتياطي في حال توقف الأول
                res = await axios.get(`https://sticker-maker.xyz{encodeURIComponent(imgUrl)}`, {
                    responseType: 'arraybuffer'
                });
            }

            const finalSticker = Buffer.from(res.data, 'binary');

            // 4. الإرسال كملصق متوافق مع كافة الهواتف والأنظمة
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
