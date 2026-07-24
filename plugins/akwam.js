import axios from 'axios';

// خادم API مستقر وسريع جداً ومخصص للبحث الشامل في أكوام
const API_BASE = "https://shizuka.my.id"; 

const axiosConfig = {
  timeout: 15000, // مهلة 15 ثانية لحماية البوت من التعليق
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
};

export default async function ({ command, args, reply, PREFIX }) {
  
  // 1. أمر البحث عن فيلم أو مسلسل (يدعم العربي والإنجليزي)
  if (command === 'اكوام' || command === 'akwam') {
    if (args.length < 1) return reply(`❌ يرجى كتابة اسم الفيلم أو المسلسل المُراد البحث عنه!\nمثال: ${PREFIX}اكوام ناروتو أو ${PREFIX}اكوام Naruto`);
    
    await reply("🎬 *جاري البحث الفوري في خوادم أكوام المحدثة...*");
    try {
      const searchQuery = args.join(" ");
      const res = await axios.get(`${API_BASE}?search=${encodeURIComponent(searchQuery)}`, axiosConfig);
      
      // قراءة ومعالجة البيانات من السيرفر المستقر
      if (res.data && res.data.result && res.data.result.length > 0) {
        const results = res.data.result;
        let listText = `🎬 *نتائج البحث في موقع أكوام:*\n\n`;
        
        // جلب أول 10 نتائج فقط لتفادي طول الرسالة
        results.slice(0, 10).forEach((item, index) => {
          const contentUrl = item.url || item.link;
          listText += `*${index + 1}.* 📌 *الاسم:* ${item.title}\n`;
          if (item.quality || item.type) listText += `   🎯 *النوع/الجودة:* ${item.quality || item.type || 'متاح'}\n`;
          listText += `   📥 *للطلب أرسل:* \`${PREFIX}ميديا ${contentUrl}\`\n\n`;
        });
        
        listText += `💡 _انسخ أمر (ميديا) الخاص بالعمل المطلوب وأرسله للبوت لجلب روابط التحميل المباشرة._`;
        await reply(listText);
      } else {
        return reply("❌ لم يتم العثور على نتائج. جرب كتابة الاسم باللغة العربية أو تأكد من صحة الحروف.");
      }
    } catch (err) {
      console.error(err);
      return reply("❌ السيرفر يواجه ضغطاً كبيراً حالياً، يرجى إعادة المحاولة بعد ثوانٍ قليلة.");
    }
  }

  // 2. أمر جلب روابط الميديا والتحميل المباشر
  if (command === 'ميديا' || command === 'media') {
    if (args.length < 1) return reply("❌ يرجى وضع رابط ميديا أكوام المتواجد في القائمة!");
    const targetUrl = args.join(" ");

    await reply("⏳ *جاري تفكيك الرابط وجلب الجودات والتحميلات المباشرة...*");
    try {
      const res = await axios.get(`${API_BASE}?url=${encodeURIComponent(targetUrl)}`, axiosConfig);
      
      if (res.data && res.data.result) {
        const content = res.data.result;
        let movieText = `🎬 *المحتوى:* ${content.title || 'أكوام ميديا'}\n\n`;
        
        // التحقق من مصفوفات الروابط المتوفرة في السيرفر
        const downloads = content.downloads || content.downloadLinks || content.list || [];
        if (downloads.length > 0) {
          downloads.forEach((link) => {
            const finalUrl = link.downloadUrl || link.link || link.url;
            movieText += `🎯 *الجودة:* ${link.quality || 'تحميل مباشر'}\n🔗 *الرابط:* ${finalUrl}\n\n`;
          });
          movieText += `💡 _اضغط على الرابط الأزرق للجودة المطلوبة لبدء التحميل الفوري أو المشاهدة في المتصفح!_`;
          await reply(movieText);
        } else {
          await reply("⚠️ المعذرة، السيرفر لم يجد روابط تحميل مباشرة متوفرة لهذا الرابط حالياً.");
        }
      } else {
        await reply("❌ فشل السيرفر في جلب البيانات، تأكد من صحة الرابط.");
      }
    } catch (err) {
      console.error(err);
      await reply("❌ حدث خطأ أثناء جلب الروابط من السيرفر المطور.");
    }
  }
}
