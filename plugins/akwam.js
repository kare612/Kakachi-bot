import axios from 'axios';

// الانتقال إلى سيرفر API جديد ومستقر تماماً وبدون انقطاع
const API_BASE = "https://shizuka.my.id"; 

const axiosConfig = {
  timeout: 15000, // مهلة 15 ثانية كحد أقصى لحماية البوت من التعليق
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
};

export default async function ({ command, args, reply, PREFIX }) {
  
  // 1. أمر البحث عن فيلم أو مسلسل
  if (command === 'اكوام' || command === 'akwam') {
    if (args.length < 1) return reply(`❌ يرجى كتابة اسم الفيلم أو المسلسل!\nمثال: ${PREFIX}اكوام ناروتو`);
    
    await reply("🎬 *جاري البحث في السيرفر الجديد والآمن...*");
    try {
      const res = await axios.get(`${API_BASE}?search=${encodeURIComponent(args.join(" "))}`, axiosConfig);
      
      // قراءة البيانات من هيكلية الخادم الجديد
      if (res.data && res.data.result && res.data.result.length > 0) {
        const results = res.data.result;
        let listText = `🎬 *نتائج البحث في موقع أكوام المطور:*\n\n`;
        
        results.slice(0, 10).forEach((item, index) => {
          const contentUrl = item.url || item.link;
          listText += `*${index + 1}.* 📌 *الاسم:* ${item.title}\n`;
          listText += `   📥 *للطلب أرسل:* \`${PREFIX}ميديا ${contentUrl}\`\n\n`;
        });
        await reply(listText);
      } else {
        return reply("❌ لم يتم العثور على نتائج، جرب كتابة الاسم بطريقة أخرى.");
      }
    } catch (err) {
      console.error(err);
      return reply("❌ السيرفر الحالي يواجه ضغطاً كبيراً، يرجى إعادة المحاولة بعد ثوانٍ قليلة.");
    }
  }

  // 2. أمر جلب الروابط والميديا
  if (command === 'ميديا' || command === 'media') {
    if (args.length < 1) return reply("❌ يرجى وضع رابط ميديا أكوام المتواجد في القائمة!");
    const targetUrl = args[0];

    await reply("⏳ *جاري جلب تفاصيل الجودات وروابط التحميل الفورية...*");
    try {
      const res = await axios.get(`${API_BASE}?url=${encodeURIComponent(targetUrl)}`, axiosConfig);
      
      if (res.data && res.data.result) {
        const content = res.data.result;
        let movieText = `🎬 *المحتوى:* ${content.title || 'أكوام ميديا'}\n\n`;
        
        // التحقق من مصفوفة التحميلات المتاحة في السيرفر الجديد
        const downloads = content.downloads || content.downloadLinks || [];
        if (downloads.length > 0) {
          downloads.forEach((link) => {
            const finalUrl = link.downloadUrl || link.link || link.url;
            movieText += `🎯 *الجودة:* ${link.quality || 'عالية'}\n🔗 *رابط مباشر:* ${finalUrl}\n\n`;
          });
          movieText += `💡 _اضغط على الرابط المباشر للجودة المطلوبة للتحميل الفوري عبر المتصفح!_`;
          await reply(movieText);
        } else {
          await reply("⚠️ المعذرة، السيرفر لم يجد روابط تحميل مباشرة لهذا الرابط حالياً.");
        }
      } else {
        await reply("❌ فشل السيرفر في فك محتويات الرابط، تأكد من صحته.");
      }
    } catch (err) {
      console.error(err);
      await reply("❌ حدث خطأ أثناء جلب الروابط من السيرفر المطور.");
    }
  }
}
