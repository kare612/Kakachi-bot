import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    command: ['ملصق', 'sticker', 'سلوق'],
    category: 'tools',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        
        // التحقق من نوع الرسالة (سواء كانت صورة مباشرة أو رداً على صورة)
        const messageType = msg.message?.imageMessage || 
                            msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

        if (!messageType) {
            return await sock.sendMessage(chatJid, { 
                text: '❌ *خطأ:* يرجى إرسال صورة مع كتابة أمر *.ملصق* أو الرد على صورة موجودة مسبقاً!' 
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatJid, { text: '⏳ *جاري تحويل الصورة إلى ملصق...*' }, { quoted: msg });
            
            // جلب بيانات الصورة وتحميلها كـ Buffer
            const targetMessage = msg.message?.imageMessage ? msg.message.imageMessage : msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            const stream = await downloadContentFromMessage(targetMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // إرسال الملصق مباشرة إلى المحادثة
            await sock.sendMessage(chatJid, { sticker: buffer }, { quoted: msg });

        } catch (error) {
            console.error("خطأ في معالجة الملصق:", error);
            await sock.sendMessage(chatJid, { text: '❌ حدث خطأ أثناء تحويل الصورة إلى ملصق.' }, { quoted: msg });
        }
    }
};
