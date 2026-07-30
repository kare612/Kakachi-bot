import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    command: ['ملصق', 'sticker', 'سلوق'],
    category: 'tools',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        
        // التحقق الآمن والمحمي لمنع ظهور خطأ null أو توقف البوت
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
            
            // تحديد كائن الصورة الصحيح بناءً على طريقة الإرسال
            const targetMessage = isDirectImage ? msg.message.imageMessage : quotedMessage.imageMessage;
            
            const stream = await downloadContentFromMessage(targetMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            await sock.sendMessage(chatJid, { sticker: buffer }, { quoted: msg });

        } catch (error) {
            console.error("خطأ في معالجة الملصق:", error);
            await sock.sendMessage(chatJid, { text: '❌ حدث خطأ أثناء تحويل الصورة إلى ملصق.' }, { quoted: msg });
        }
    }
};
