const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

async function handleTermuxVideo(client, m, videoUrlOrBuffer) {
    try {
        await client.sendMessage(m.chat, { text: '⏳ جاري معالجة وتشغيل الفيديو عبر Termux...' }, { quoted: m });

        const inputPath = path.join(__dirname, 'input_video.mp4');
        const outputPath = path.join(__dirname, 'output_video.mp4');

        // إذا كان المدخل رابط مباشر للفيديو
        if (typeof videoUrlOrBuffer === 'string') {
            // إرسال الفيديو مباشرة من الرابط، حيث يقوم ffmpeg الداخلي بالتعامل معه
            await client.sendMessage(m.chat, {
                video: { url: videoUrlOrBuffer },
                caption: '🎬 تم التشغيل بنجاح!',
                mimetype: 'video/mp4'
            }, { quoted: m });
        } 
        // إذا قام المستخدم بإرسال فيديو وتريد إعادة معالجته ليعمل بخفة
        else {
            fs.writeFileSync(inputPath, videoUrlOrBuffer);

            // استخدام ffmpeg لضبط أبعاد ومخرجات الفيديو ليعمل بأعلى كفاءة على الواتساب
            ffmpeg(inputPath)
                .outputOptions([
                    '-vcodec libx264',
                    '-acodec aac',
                    '-pix_fmt yuv420p',
                    '-profile:v baseline',
                    '-level 3.0'
                ])
                .save(outputPath)
                .on('end', async () => {
                    await client.sendMessage(m.chat, {
                        video: fs.readFileSync(outputPath),
                        caption: '✅ تم تشغيل وضغط الفيديو بنجاح عبر Termux',
                        mimetype: 'video/mp4'
                    }, { quoted: m });

                    // تنظيف الملفات المؤقتة لتوفير مساحة الهاتف
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                });
        }
    } catch (error) {
        console.error(error);
        await client.sendMessage(m.chat, { text: '❌ فشل تشغيل الفيديو، تأكد من حجم الملف.' }, { quoted: m });
    }
}
