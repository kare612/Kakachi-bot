import axios from 'axios';

// استخدام سيرفر API بديل وسريع ومستقر للبحث في أكوام
const API_BASE = "https://vreden.web.id"; 

const axiosConfig = {
  timeout: 15000, // مهلة 15 ثانية لحماية البوت من التجميد
  headers: { 'User-Agent': 'Mozilla/5.0' }
};

export default async function ({ command, args, reply, PREFIX }) {
  
  if (command === 'اكوام' || command === 'akwam') {
    if (args.length < 1) return reply(`❌ يرجى كتابة اسم الفيلم أو المسلسل!\nمثال: ${PREFIX}اكوام ناروتو`);
    
    await reply("🎬 *جاري البحث في خوادم أكوام المحدثة...*");
    try {
      const res = await axios.get(`${API_BASE}?search=${encodeURIComponent(args.join(" "))}`, axiosConfig);
      
      // التحقق من استجابة السيرفر الجديد
      if (res.data && res.data.status === 200 && res.data.result && res.data.result.length > 0) {
        const results = res.data.result;
        let listText = `🎬 *نتائج البحث في موقع أكوام:*\n\n`;
        
        results.slice(0, 10).forEach((item, index) => {
          listText += `*${index + 1}.* 📌 *الاسم:* ${item.title}\n`;
          listText += `   📥 *للطلب أرسل:* \`${PREFIX}ميديا ${item.url || item.link}\`\n\n`;
        });
        await reply(listText);
      } else {
        return reply("❌ لم يتم العثور على نتائج لهذا الاسم حالياً.");
      }
    } catch (err) {
      console.error(err);
      return reply("❌ السيرفر بطيء أو لا يستجيب حالياً، جرب اسماً آخر لاحقاً.");
    }
  }

  if (command === 'ميديا' || command === 'media') {
    if (args.length < 1) return reply("❌ يرجى وضع الرابط الصحيح المتواجد في القائمة!");
    
    await reply("⏳ *جاري جلب تفاصيل الجودات وروابط التحميل...*");
    try {
      const res = await axios.get(`${API_BASE}?url=${encodeURIComponent(args[0])}`, axiosConfig);
      
      if (res.data && res.data.status === 200 && res.data.result) {
        const content = res.data.result;
        let movieText = `🎬 *المحتوى:* ${content.title || 'أكوام ميديا'}\n\n`;
        
        if (content.downloads && content.downloads.length > 0) {
          content.downloads.forEach((link) => {
            movieText += `🎯 *الجودة:* ${link.quality || 'عالية'}\n🔗 *رابط مباشر:* ${link.downloadUrl || link.link}\n\n`;
          });
          movieText += `💡 _اضغط على الرابط المباشر للجودة المطلوبة للتحميل أو المشاهدة فوراً!_`;
          await reply(movieText);
        } else {
          await reply("⚠️ لم يتم العثور على روابط تحميل مباشرة حالياً.");
        }
      } else {
        await reply("❌ فشل السيرفر في جلب تفاصيل الرابط.");
      }
    } catch (err) {
      console.error(err);
      await reply("❌ حدث خطأ أثناء جلب الروابط من السيرفر.");
    }
  }
}
