import axios from 'axios';

const API_BASE = "https://bk9.fun"; 

const axiosConfig = {
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
};

// تم إصلاح طريقة استقبال المتغيرات هنا عبر إضافة القوسين الزوجيين { }
export default async function ({ command, args, reply, PREFIX }) {
  try {
    // 1. أمر البحث عن فيلم أو مسلسل
    if (command === 'اكوام' || command === 'akwam') {
      if (!args || args.length < 1) return reply(`❌ يرجى كتابة اسم الفيلم أو المسلسل!\nمثال: ${PREFIX}اكوام رجال مقنع`);
      
      await reply("🎬 *جاري البحث الفوري في خوادم أكوام المستقرة...*");
      const searchQuery = args.join(" ");
      const res = await axios.get(`${API_BASE}?q=${encodeURIComponent(searchQuery)}`, axiosConfig);
      
      if (res.data && res.data.BK9 && res.data.BK9.length > 0) {
        const results = res.data.BK9;
        let listText = `🎬 *نتائج البحث في موقع أكوام:*\n\n`;
        
        results.slice(0, 10).forEach((item, index) => {
          listText += `*${index + 1}.* 📌 *الاسم:* ${item.title || 'بدون اسم'}\n`;
          if (item.type) listText += `   🎯 *النوع:* ${item.type}\n`;
          if (item.quality) listText += `   ⭐ *الجودة:* ${item.quality}\n`;
          listText += `   📥 *للطلب أرسل:* \`${PREFIX}ميديا ${item.url}\`\n\n`;
        });
        
        listText += `💡 _انسخ أمر (ميديا) الخاص بالعمل المطلوب وأرسله للبوت لجلب روابط التحميل المباشرة._`;
        await reply(listText);
      } else {
        return reply("❌ لم يتم العثور على نتائج. تأكد من كتابة الاسم بشكل صحيح.");
      }
    }

    // 2. أمر جلب روابط الميديا والتحميل المباشر
    if (command === 'ميديا' || command === 'media') {
      if (!args || args.length < 1) return reply("❌ يرجى وضع رابط ميديا أكوام المتواجد في القائمة!");
      const targetUrl = args.join(" ");

      await reply("⏳ *جاري تفكيك الرابط وجلب الجودات والتحميلات المباشرة...*");
      const res = await axios.get(`${API_BASE}?url=${encodeURIComponent(targetUrl)}`, axiosConfig);
      
      if (res.data && res.data.BK9) {
        const content = res.data.BK9;
        let movieText = `🎬 *المحتوى:* ${content.title || 'أكوام ميديا'}\n\n`;
        
        const downloads = content.downloads || content.downloadLinks || content.results || [];
        if (downloads.length > 0) {
          downloads.forEach((link) => {
            const finalUrl = link.downloadUrl || link.link || link.url;
            movieText += `🎯 *الجودة:* ${link.quality || 'تحميل مباشر'}\n🔗 *الرابط:* ${finalUrl}\n\n`;
          });
          movieText += `💡 _اضغط على الرابط المباشر للجودة المطلوبة للتحميل الفوري عبر المتصفح!_`;
          await reply(movieText);
        } else {
          await reply("⚠️ المعذرة، السيرفر لم يجد روابط تحميل مباشرة متوفرة لهذا الرابط حالياً.");
        }
      } else {
        await reply("❌ فشل السيرفر في جلب البيانات، تأكد من صحة الرابط.");
      }
    }
  } catch (err) {
    console.error(err);
  }
}
