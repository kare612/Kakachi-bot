import axios from 'axios';

export default {
    command: ['صوت', 'اغنية', 'play', 'فيديو', 'فديو', 'video', 'mp4', 'mp3'],
    category: 'download',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        const videoUrl = args?.join(' ') || args;

        if (!videoUrl || !videoUrl.startsWith('http')) {
            return await sock.sendMessage(chatJid, { 
                text: '⚠️ *تنبيه:* يرجى وضع رابط صحيح بعد الأمر!\n\n*مثال:* `.صوت رابط_الفيديو`' 
            }, { quoted: msg });
        }

        const userCommand = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const isVideoRequest = /فيديو|فديو|video|mp4/i.test(userCommand);

        try {
            await sock.sendMessage(chatJid, { text: '⏳ *جاري المعالجة وسحب الملف من السيرفر المستقر...*' }, { quoted: msg });

            // استخدام API تحميل سريع ومفتوح ومخصص للبوتات لتفادي الحظر والأخطاء الداخلية
            const apiUrl = `https://vreden.web.id{encodeURIComponent(videoUrl)}`;
            const response = await axios.get(apiUrl);
            
            const downloadData = response.data?.result;
            const targetMediaUrl = isVideoRequest ? downloadData?.video : downloadData?.audio;

            if (!targetMediaUrl) throw new Error("Media URL not found");

            // جلب بافر الملف الصوتي أو المرئي
            const mediaRes = await axios.get(targetMediaUrl, { responseType: 'arraybuffer' });
            const mediaBuffer = Buffer.from(mediaRes.data, 'binary');

            if (isVideoRequest) {
                await sock.sendMessage(chatJid, { 
                    video: mediaBuffer, 
                    mimetype: 'video/mp4',
                    caption: '✅ تم تحميل الفيديو بنجاح.'
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatJid, { 
                    audio: mediaBuffer, 
                    mimetype: 'audio/mp4', 
                    ptt: false 
                }, { quoted: msg });
            }

        } catch (error) {
            console.error("خطأ أثناء معالجة التنزيل:", error);
            await sock.sendMessage(chatJid, { 
                text: '❌ *عذراً:* الرابط غير مدعوم حالياً أو السيرفر تحت الصيانة، جرب رابطاً آخر.' 
            }, { quoted: msg });
        }
    }
};
