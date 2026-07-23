/**
 * Api By Johan Dev
 * Code By Johan Dev
 * movie and serious dl & search
 * Fixed & Adapted for Kakachi-Bot System
 */

import axios from 'axios';

function _r(s) {
  return s.split('+').map(t => t.trim().replace(/[()']/g, '')).join('');
}

const API_BASE = _r("('https') + '://' + 'johan-vex-apis' + ('.') + 'vercel' + ('.') + 'app' + '/api/search/akwam'");

async function apiSearch(query) {
  const res = await axios.get(API_BASE, { params: { q: query }, timeout: 20000 });
  if (!res.data?.success) throw new Error(res.data?.error || 'فشل البحث');
  return res.data.results || [];
}

async function apiContent(url) {
  const res = await axios.get(API_BASE, { params: { url }, timeout: 30000 });
  if (!res.data?.success) throw new Error(res.data?.error || 'فشل جلب المحتوى');
  return res.data.result;
}

async function apiResolve(downloadPageUrl) {
  const res = await axios.get(API_BASE, { params: { resolve: downloadPageUrl }, timeout: 30000 });
  if (!res.data?.success) throw new Error(res.data?.error || 'فشل فك التشفير');
  return res.data.result;
}

export default async function ({ command, args, reply, PREFIX }) {
  
  // 1. أمر البحث عن فيلم أو مسلسل
  if (command === 'اكوام' || command === 'akwam') {
    if (args.length < 1) return reply(`❌ يرجى كتابة اسم الفيلم أو المسلسل للبحث عنه بعد الأمر!\nمثال: ${PREFIX}اكوام ون بيس`);
    
    await reply("🎬 *جاري البحث في خوادم أكوام عبر الـ API...*");
    try {
      const results = await apiSearch(args.join(" "));
      if (!results || results.length === 0) return reply("❌ لم يتم العثور على أي نتائج تطابق هذا الاسم.");
      
      let listText = `🎬 *نتائج البحث في موقع أكوام:*\n\n`;
      results.forEach((item, index) => {
        listText += `*${index + 1}.* 📌 *الاسم:* ${item.title}\n`;
        listText += `   ⭐ *التقييم:* ${item.rating || 'غير متاح'}\n`;
        listText += `   📥 *لطلب المحتوى أرسل:* \`${PREFIX}ميديا ${item.url}\`\n\n`;
      });
      listText += `💡 _انسخ أمر الميديا الخاص بالفيلم أو المسلسل المطلوب وأرسله للبوت للتكملة._`;
      await reply(listText);
    } catch (err) {
      reply(`❌ حدث خطأ أثناء البحث: ${err.message}`);
    }
  }

  // 2. أمر جلب حلقات المسلسل أو روابط تحميل الفيلم
  if (command === 'ميديا' || command === 'media') {
    if (args.length < 1) return reply("❌ يرجى وضع رابط ميديا أكوام الصحيح!");
    // تم الإصلاح هنا لاستخراج الرابط الأول بشكل صحيح بدلاً من المصفوفة كاملة
    const targetUrl = args[0]; 
    
    await reply("⏳ *جاري جلب تفاصيل المحتوى والروابط...*");
    try {
      const content = await apiContent(targetUrl);
      if (content.type === 'movie') {
        let movieText = `🎬 *فيلم:* ${content.title}\n\n`;
        if (content.downloadLinks && content.downloadLinks.length > 0) {
          content.downloadLinks.forEach((link) => {
            movieText += `🎯 *الجودة:* ${link.quality} (${link.size || 'حجم غير معروف'})\n`;
            movieText += `🔗 *رابط فك التشفير:* \`${PREFIX}فك ${link.downloadPageUrl}\`\n\n`;
          });
          movieText += `💡 _للحصول على الرابط المباشر للفيلم انسخ أمر (فك) للجودة المطلوبة وأرسله للبوت._`;
        } else {
          movieText += `⚠️ لم يتم العثور على روابط تحميل مباشرة لهذا الفيلم حالياً.`;
        }
        await reply(movieText);
      } else if (content.type === 'series') {
        let seriesText = `📺 *مسلسل:* ${content.title}\n\n`;
        if (content.episodes && content.episodes.length > 0) {
          content.episodes.forEach((ep) => {
            seriesText += `🔹 *${ep.title}:* \`${PREFIX}فك ${ep.url}\`\n`;
          });
          seriesText += `\n💡 _لتحميل أي حلقة انسخ أمر (فك) المكتوب بجانبها وأرسله للبوت لجلب روابط الجودات._`;
        } else {
          seriesText += `⚠️ لا توجد حلقات متاحة لهذا المسلسل حالياً.`;
        }
        await reply(seriesText);
      }
    } catch (err) {
      reply(`❌ فشل في معالجة الروابط: ${err.message}`);
    }
  }

  // 3. أمر فك تشفير الرابط النهائي وجلب الرابط المباشر
  if (command === 'فك' || command === 'resolve') {
    if (args.length < 1) return reply("❌ يرجى وضع الرابط المشفر المخصص لفك التشفير!");
    // تم الإصلاح هنا لضمان قراءة رابط الصفحة المشفرة بشكل صحيح ودون أخطاء مسارات
    const downloadPageUrl = args[0]; 
    
    await reply("🔓 *جاري فك تشفير الرابط النهائي وجلب الرابط المباشر...*");
    try {
      const resolved = await apiResolve(downloadPageUrl);
      if (resolved && resolved.directUrl) {
        const textMsg = `✅ *تم فك التشفير بنجاح!* \n\n📁 *اسم الملف:* ${resolved.filename || 'فيديو'}\n🔗 *رابط التحميل والمشاهدة المباشر:*\n${resolved.directUrl}\n\n🌐 _اضغط على الرابط في الأعلى للمشاهدة أو التحميل الفوري من المتصفح بأقصى سرعة._`;
        await reply(textMsg);
      } else {
        reply("❌ السيرفر لم يقم بإرجاع رابط مباشر، جرب جودة أخرى.");
      }
    } catch (err) {
      reply(`❌ فشل فك التشفير: ${err.message}`);
    }
  }
  }
