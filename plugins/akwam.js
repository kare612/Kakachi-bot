import axios from 'axios';

// سيرفر API بديل مستقر وسريع جداً لعام 2026
const API_BASE = "https://vreden.web.id"; 

const axiosConfig = {
  timeout: 12000, // مهلة 12 ثانية كحد أقصى لمنع التجميد والـ Timeout
  headers: { 'User-Agent': 'Mozilla/5.0' }
};

export default async function ({ command, args, reply, PREFIX, sock, from }) {
  
  // 1. أمر البحث
  if (command === 'اكوام' || command === 'akwam') {
    if (args.length < 1) return reply(`❌ يرجى كتابة اسم الفيلم أو المسلسل!\nمثال: ${PREFIX}اكوام ناروتو`);
    
    await reply("🎬 *جاري البحث في خوادم أكوام الحديثة...*");
    try {
      const res = await axios.get(`${API_BASE}?search=${encodeURIComponent(args.join(" "))}`, axiosConfig);
      
      if (res.data && res.data.result && res.data.result.length > 0) {
        const results = res.data.result;
        let listText = `🎬 *نتائج البحث في موقع أكوام:*\n\n`;
        
        results.slice(0, 10).forEach((item, index) => {
          const contentUrl = item.url || item.link;
          listText += `*${index + 1}.* 📌 *الاسم:* ${item.title}\n`;
          listText += `   📥 *للطلب أرسل:* \`${PREFIX}ميديا ${contentUrl}\`\n\n`;
        });
        await reply(listText);
      } else {
        return reply("❌ لم يتم العثور على نتائج، جرب اسماً آخر بصيغة مختلفة.");
      }
    } catch (err) {
      return reply("❌ السيرفر يواجه ضغطاً حالياً ولم يستجب، جرب مرة أخرى لاحقاً.");
    }
  }

  // 2. أمر جلب الروابط والميديا
  if (command === 'ميديا' || command === 'media') {
    if (args.length < 1) return reply("❌ يرجى وضع رابط ميديا أكوام المتواجد في القائمة!");
    const targetUrl = args[0];

    await reply("⏳ *جاري سحب تفاصيل الجودات وروابط التحميل الفورية...*");
    try {
      const res = await axios.get(`${API_BASE}?url=${encodeURIComponent(targetUrl)}`, axiosConfig);
      
      if (res.data && res.data.result) {
        const content = res.data.result;
        let movieText = `🎬 *المحتوى:* ${content.title || 'أكوام ميديا'}\n\n`;
        
        // التحقق من مصفوفة التحميلات المتاحة
        const downloads = content.downloads || content.downloadLinks;
        if (downloads && downloads.length > 0) {
          downloads.forEach((link) => {
            const finalUrl = link.downloadUrl || link.link || link.downloadPageUrl;
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
      await reply("❌ حدث خطأ أو انتهت مهلة طلب الروابط من السيرفر.");
    }
  }
}
