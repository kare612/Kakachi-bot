import axios from 'axios';

export default async function ({ command, args, reply, BOT_NAME, sock, from, mek }) {
    switch (command) {
        case 'فيديو':
        case 'video':
            if (args.length < 1) return reply("❌ يرجى وضع رابط الفيديو!");
            await reply("⏳ *جاري تحميل الفيديو عبر الـ API...*");
            try {
                const res = await axios.get(`https://lolhuman.xyz{encodeURIComponent(args[0])}`);
                await sock.sendMessage(from, { video: { url: res.data.result.link }, caption: `✨ تم التحميل بواسطة ${BOT_NAME}` }, { quoted: mek });
            } catch { reply("❌ خطأ في تحميل الفيديو."); }
            break;

        case 'صوت':
        case 'mp3':
            if (args.length < 1) return reply("❌ يرجى وضع رابط المقطع الصوتي!");
            await reply("🎧 *جاري سحب الملف الصوتي من الـ API...*");
            try {
                const res = await axios.get(`https://lolhuman.xyz{encodeURIComponent(args[0])}`);
                await sock.sendMessage(from, { audio: { url: res.data.result.link }, mimetype: 'audio/mp4' }, { quoted: mek });
            } catch { reply("❌ فشل تحميل الصوت."); }
            break;

        case 'قول':
            if (args.length < 1) return reply("❌ يرجى كتابة النص لتحويله لصوت!");
            try {
                const ttsUrl = `https://lolhuman.xyz{encodeURIComponent(args.join(" "))}`;
                await sock.sendMessage(from, { audio: { url: ttsUrl }, mimetype: 'audio/mp4', ptt: true }, { quoted: mek });
            } catch { reply("❌ خطأ في خادم الصوت."); }
            break;

        default:
            break;
    }
}
