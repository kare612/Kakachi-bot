import axios from 'axios';

export default async function ({ command, args, reply, BOT_NAME, sock, from, mek }) {
    switch (command) {
        case 'ذكاء':
        case 'gpt':
        case 'ai':
            if (args.length < 1) return reply("❌ يرجى كتابة سؤالك بعد الأمر!\nمثال: .ذكاء من أنت؟");
            await reply("🤖 *جاري التفكير وتوليد الرد...*");
            try {
                const res = await axios.get(`https://lolhuman.xyz{encodeURIComponent(args.join(" "))}`);
                if (res.data && res.data.result) {
                    return reply(res.data.result);
                } else {
                    return reply("❌ عذراً، خادم الذكاء الاصطناعي لا يستجيب حالياً.");
                }
            } catch (err) {
                return reply("❌ حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.");
            }

        case 'فيديو':
        case 'video':
            if (args.length < 1) return reply("❌ يرجى وضع رابط الفيديو بعد الأمر!");
            await reply("⏳ *جاري معالجة الرابط وتحميل الفيديو عبر الـ API...*");
            try {
                const res = await axios.get(`https://lolhuman.xyz{encodeURIComponent(args[0])}`);
                if (res.data && res.data.result && res.data.result.link) {
                    await sock.sendMessage(from, { video: { url: res.data.result.link }, caption: `✨ تم التحميل بواسطة ${BOT_NAME}` }, { quoted: mek });
                } else {
                    reply("❌ فشل الـ API في جلب الفيديو، تأكد من صحة الرابط.");
                }
            } catch (err) {
                reply("❌ حدث خطأ أثناء التحميل (API Error).");
            }
            break;

        case 'صوت':
        case 'mp3':
            if (args.length < 1) return reply("❌ يرجى وضع رابط المقطع الصوتي!");
            await reply("🎧 *جاري سحب الملف الصوتي وتحميله...*");
            try {
                const res = await axios.get(`https://lolhuman.xyz{encodeURIComponent(args[0])}`);
                if (res.data && res.data.result && res.data.result.link) {
                    await sock.sendMessage(from, { audio: { url: res.data.result.link }, mimetype: 'audio/mp4' }, { quoted: mek });
                } else {
                    reply("❌ فشل تحميل الصوت من الرابط المرفق.");
                }
            } catch (err) {
                reply("❌ خطأ في الـ API الخاص بالتحميل الصوتي.");
            }
            break;

        default:
            break;
    }
}
