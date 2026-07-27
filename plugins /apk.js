// كود ميزة البحث وتحميل تطبيقات الأندرويد (APK) لبوت كاكاشي
const axios = require('axios');

module.exports = {
    name: 'تطبيق',
    alias: ['برنامج', 'لعبه', 'apk', 'تحميل_تطبيق'],
    category: 'downloader',
    desc: 'البحث عن تطبيقات وألعاب الأندرويد وتحميلها مباشرة كملف APK',
    async execute(client, m, { text, args }) {
        // 1. التحقق من كتابة اسم التطبيق
        if (!text) {
            return await client.sendMessage(m.chat, { 
                text: '⚠️ يرجى كتابة اسم التطبيق أو اللعبة بعد الأمر.\nمثال:\n.تطبيق whatsapp' 
            }, { quoted: m });
        }

        const appName = text.trim();

        try {
            // 2. إرسال رسالة تفيد ببدء البحث والتحميل
            await client.sendMessage(m.chat, { text: `🔍 جاري البحث عن تطبيق [ ${appName} ] وتحميله كملف APK، انتظر قليلاً...` }, { quoted: m });

            // 3. استخدام واجهة برمجة (API) مجانية للبحث وتحميل تطبيقات الأندرويد
            const response = await axios.get(`https://eu.org{encodeURIComponent(appName)}&apikey=XYZ`);
            
            if (!response.data || !response.data.result) {
                throw new Error("تطبيق غير موجود أو السيرفر لا يستجيب");
            }

            const appData = response.data.result;
            const apkUrl = appData.download; // رابط التحميل المباشر للملف
            const filename = `${appData.name}.apk`;

            // 4. إرسال معلومات التطبيق أولاً للمستخدم كرسالة نصية مع الصورة إن وجدت
            const infoText = `📦 *تم العثور على التطبيق بنجاح!* 📦\n\n` +
                             `📱 *الاسم:* ${appData.name}\n` +
                             `🆔 *الحزمة:* ${appData.package}\n` +
                             `📅 *آخر تحديث:* ${appData.last_updated || 'غير محدد'}\n` +
                             `⚖️ *الحجم:* ${appData.size || 'غير محدد'}\n\n` +
                             `🚀 جاري رفع وإرسال الملف الآن إلى هاتفك...`;

            if (appData.icon) {
                await client.sendMessage(m.chat, { image: { url: appData.icon }, caption: infoText }, { quoted: m });
            } else {
                await client.sendMessage(m.chat, { text: infoText }, { quoted: m });
            }

            // 5. إرسال ملف الـ APK الفعلي ليقوم المستخدم بتثبيته مباشرة
            await client.sendMessage(m.chat, {
                document: { url: apkUrl },
                mimetype: 'application/vnd.android.package-archive',
                fileName: filename,
                caption: `✅ تم تحميل ${appData.name} بنجاح عبر بوت كاكاشي.`
            }, { quoted: m });

        } catch (error) {
            console.error("خطأ في كود تحميل التطبيقات:", error);
            
            // محاولة استخدام سيرفر بديل مفتوح المصدر للتحميل
            try {
                const fallbackResponse = await axios.get(`https://lolhuman.xyz{encodeURIComponent(appName)}`);
                const fallbackData = fallbackResponse.data.result;
                
                await client.sendMessage(m.chat, {
                    document: { url: fallbackData.apk_link },
                    mimetype: 'application/vnd.android.package-archive',
                    fileName: `${fallbackData.apk_name}.apk`,
                    caption: `✅ تم التحميل عبر السيرفر البديل.`
                }, { quoted: m });
                
            } catch (fallbackError) {
                await client.sendMessage(m.chat, { 
                    text: '❌ عذراً، تعذر العثور على التطبيق أو أن حجمه كبير جداً ويتخطى الحد المسموح به في الواتساب.' 
                }, { quoted: m });
            }
        }
    }
};
              
