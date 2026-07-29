import axios from 'axios';

export default {
    name: 'تنزيل',
    alias: ['تحميل', 'فيديو', 'video', 'down'],
    category: 'user',
    async execute(client, msg, args) {
        const chatJid = msg.key.remoteJid;
        const videoUrl = args[0];

        // التحقق من قيام المستخدم بإدخال الرابط
        if (!videoUrl) {
            return await client.sendMessage(chatJid, { 
                text: '⚠️ *خطأ:* يرجى وضع رابط الفيديو المراد تحميله بعد الأمر مباشرة.\n\n💡 *مثال:* `.تنزيل https://example.com`' 
            }, { quoted: msg });
        }

        // إشعار المستخدم ببدء معالجة الطلب
        const statusMsg = await client.sendMessage(chatJid, { text: '⏳ جاري جلب وتحميل مقطع الفيديو، يرجى الانتظار قليلاً...' }, { quoted: msg });

        try {
            // استخدام واجهة API عامة ومجانية لاستخراج روابط الفيديو المباشرة
            const apiResponse = await axios.get(`https://vreden.web.id{encodeURIComponent(videoUrl)}`);
            
            // استخراج الرابط المباشر للمقطع من نتيجة الـ API
            const directVideoLink = apiResponse.data?.result?.video?.noWatermark || apiResponse.data?.result?.video;

            if (!directVideoLink) {
                throw new Error('لم يتم العثور على رابط مباشر للفيديو');
            }

            // إرسال مقطع الفيديو المستخرج إلى المحادثة فوراً
            await client.sendMessage(chatJid, { 
                video: { url: directVideoLink }, 
                caption: '🎬 *تم التحميل بنجاح بواسطة بوت كاكاشي الأسطوري!*' 
            }, { quoted: msg });

            // حذف رسالة الانتظار المؤقتة
            await client.sendMessage(chatJid, { delete: statusMsg.key });

        } catch (error) {
            console.error('خطأ أثناء تحميل الفيديو:', error);
            
            // إخطار المستخدم في حال فشل خادم الـ API أو عدم دعم الرابط المرسل
            await client.sendMessage(chatJid, { 
                text: '❌ *فشل التحميل:* نأسف، تعذر تحميل الفيديو. تأكد من أن الرابط صحيح أو جرب رابطاً آخر لاحقاً.' 
            }, { quoted: msg });
        }
    }
};
