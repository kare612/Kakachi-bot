import axios from 'axios';

export default {
    // الأوامر التي تدعم تحميل الصوتيات والفيديوهات من نفس الملف
    command: ['صوت', 'اغنية', 'play', 'فيديو', 'فديو', 'video', 'mp4', 'mp3'],
    category: 'download',
    async default({ sock, msg, args }) {
        const chatJid = msg.key.remoteJid;
        
        // جلب الرابط المكتوب بعد الأمر مباشرة
        const videoUrl = args?.join(' ') || args;

        if (!videoUrl || !videoUrl.startsWith('http')) {
            return await sock.sendMessage(chatJid, { 
                text: '⚠️ *تنبيه:* يرجى وضع رابط الفيديو الصحيح بعد الأمر!\n\n*مثال:* `.صوت https://youtu.be...` أو `.فيديو https://youtu.be...`' 
            }, { quoted: msg });
        }

        // تحديد نوع التحميل المطلوب بناءً على الكلمة التي كتبها المستخدم في الأمر
        const userCommand = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const isVideoRequest = /فيديو|فديو|video|mp4/i.test(userCommand);

        try {
            if (isVideoRequest) {
                // --- أولاً: قسم تحميل الفيديو (MP4) ---
                await sock.sendMessage(chatJid, { text: '⏳ *جاري تحميل ومعالجة مقطع الفيديو فوراً...*' }, { quoted: msg });

                let res;
                try {
                    // السيرفر الأساسي لتحميل الفيديو
                    res = await axios.get(`https://dreaded.site{encodeURIComponent(videoUrl)}`, {
                        responseType: 'arraybuffer'
                    });
                } catch {
                    // السيرفر الاحتياطي الشامل في حال توقف الأول
                    res = await axios.get(`https://boxmineworld.com{encodeURIComponent(videoUrl)}`, {
                        responseType: 'arraybuffer'
                    });
                }

                const videoBuffer = Buffer.from(res.data, 'binary');

                // إرسال الفيديو مباشرة للمحادثة
                await sock.sendMessage(chatJid, { 
                    video: videoBuffer, 
                    mimetype: 'video/mp4',
                    caption: '✅ تم تحميل الفيديو بنجاح بواسطة البوت.'
                }, { quoted: msg });

            } else {
                // --- ثانياً: قسم تحميل الصوت (MP3) ---
                await sock.sendMessage(chatJid, { text: '⏳ *جاري استخراج وتحميل الملف الصوتي فوراً...*' }, { quoted: msg });

                let res;
                try {
                    // السيرفر الأساسي لتحميل الصوت
                    res = await axios.get(`https://dreaded.site{encodeURIComponent(videoUrl)}`, {
                        responseType: 'arraybuffer'
                    });
                } catch {
                    // السيرفر الاحتياطي الشامل للصوتيات
                    res = await axios.get(`https://boxmineworld.com{encodeURIComponent(videoUrl)}`, {
                        responseType: 'arraybuffer'
                    });
                }

                const audioBuffer = Buffer.from(res.data, 'binary');

                // إرسال الصوت كملف موسيقى متوافق مع كافة الهواتف
                await sock.sendMessage(chatJid, { 
                    audio: audioBuffer, 
                    mimetype: 'audio/mp4', 
                    ptt: false // اجعلها true إذا كنت تفضل وصولها كبصمة صوتية داخل الواتساب
                }, { quoted: msg });
            }

        } catch (error) {
            console.error("خطأ أثناء معالجة التنزيل:", error);
            await sock.sendMessage(chatJid, { 
                text: '❌ *عذراً:* واجهت السيرفرات المجانية ضغطاً أو مشكلة مؤقتة في استخراج الملف من هذا الرابط حالياً، يرجى المحاولة لاحقاً.' 
            }, { quoted: msg });
        }
    }
};
