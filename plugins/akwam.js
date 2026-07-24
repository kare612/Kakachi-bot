import axios from 'axios';

// ربط البوت بالسيرفر الفعّال والمستقر كلياً لعام 2026
const API_BASE = "https://bk9.fun"; 

const axiosConfig = {
  timeout: 15000, // مهلة 15 ثانية لحماية البوت من التجميد في Termux
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
};

export default async function ({ command, args, reply, PREFIX }) {
  
  // 1. أمر البحث عن فيلم أو مسلسل (يدعم العربي والإنجليزي)
  if (command === 'اكوام' || command === 'akwam') {
    if (args.length < 1) return reply(`❌ يرجى كتابة اسم الفيلم أو المسلسل!\nمثال: ${PREFIX}اكوام ناروتو أو ${PREFIX}اكوام Naruto`);
    
    await reply("🎬 *جاري البحث الفوري في خوادم أكوام المستقرة...*");
    try {
      const searchQuery = args.join(" ");
      const res = await axios.get(`${API_BASE}?q=${encodeURIComponent(searchQuery)}`, axiosConfig);
      
      // معالجة البيانات بناءً على استجابة السيرفر الفعّال المضمون
      if (res.data && res.data.status && res.data.BK9 && res.data.BK9.length > 0) {
        const results = res.data.BK9;
        let listText = `🎬 *نتائج البحث في موقع أكوام:*\n\n`;
        
        results.slice(0, 10).forEach((item, index) => {
          const contentUrl = item.url || item.link;
          listText += `*${index + 1}.* 📌 *الاسم:* ${item.title || item.name}\n`;
          if (item.type) listText += `   🎯 *النوع:* ${item.type}\n`;
          listText += `   📥 *للطلب أرسل:* \`${PREFIX}ميديا ${contentUrl}\`\n\n`;
        });
        
        listText += `💡 _انسخ أمر (ميديا) الخاص بالعمل المطلوب وأرسله للبوت لجلب الروابط مباشرة._`;
        await reply(listText);
      } else {
        return reply("❌ لم يتم العثور على نتائج. تأكد من كتابة اسم الفيلم أو المسلسل بشكل صحيح.");
      }
    } catch (err) {
      console.error(err);
      return reply("❌ السيرفر بطيء أو لا يستجيب حالياً، يرجى إعادة المحاولة بعد قليل.");
    }
  }

  // 2. أمر جلب روابط الميديا والتحميل المباشر
  if (command === 'ميديا' || command === 'media') {
    if (args.length < 1) return reply("❌ يرجى وضع رابط ميديا أكوام المتواجد في القائمة!");
    const targetUrl = args.join(" ");

    await reply("⏳ *جاري تفكيك الرابط وجلب الجودات والتحميلات المباشرة...*");
    try {
      const res = await axios.get(`${API_BASE}?url=${encodeURIComponent(targetUrl)}`, axiosConfig);
      
      if (res.data && res.data.status && res.data.BK9) {
        const content = res.data.BK9;
        let movieText = `🎬 *المحتوى:* ${content.title || 'أكوام ميديا'}\n\n`;
        
        // التحقق من روابط التحميل المتوفرة داخل السيرفر وهيكليته
        const downloads = content.downloads || content.downloadLinks || [];
        if (downloads.length > 0) {
          downloads.forEach((link) => {
            const finalUrl = link.downloadUrl || link.link || link.url;
            movieText += `🎯 *الجودة:* ${link.quality || 'تحميل مباشر'}\n🔗 *الرابط:* ${finalUrl}\n\n`;
          });
          movieText += `💡 _اضغط على الرابط المباشر للجودة المطلوبة للتحميل الفوري أو المشاهدة عبر المتصفح!_`;
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
