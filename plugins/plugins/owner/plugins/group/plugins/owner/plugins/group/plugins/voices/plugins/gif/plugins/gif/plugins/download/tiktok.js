import crypto from 'crypto';
import cheerio from 'cheerio';
import axios from 'axios';
import qs from 'qs';

const ff = async (m, { text, conn }) => {
  if (!text) return m.reply("❌: حط رابط الفيديو جنب الأمر");
  
  try {
    
    const videoData = await downloadTikTok(text);

    if (!videoData.videoUrl && !videoData.audioUrl) {
      return m.reply("❌ Failed to download video");
    }

    if (videoData.videoUrl) {
      await conn.sendMessage(m.chat, { video: { url: videoData.videoUrl }, caption: `🟢 ${videoData.description || "no description"}` });
    }
    
    if (videoData.audioUrl) {
      await conn.sendMessage(m.chat, { audio: { url: videoData.audioUrl }, mimetype: 'audio/mpeg' });
    }
    
  } catch (error) {
    console.error(error.message);
    m.reply(error.message);
  }
};
ff.usage = ["تيك"]
ff.category = "downloads";
ff.command = ["تيك", "tiktok", "tt"];
export default ff;


async function downloadTikTok(url) {

  let data = qs.stringify({
    'id': url,
    'locale': 'en',
    'tt': crypto.randomBytes(8).toString('hex'),
  });

  let config = {
    method: 'POST',
    url: 'https://ssstik.io/abc?url=dl',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
  };

  const response = await axios.request(config);
  const $ = cheerio.load(response.data);

  return {
    author: $('h2').first().text().trim(),
    description: $('.maintext').text().trim(),
    videoUrl: $('a[href*="tikcdn.io"]:not(#hd_download)').first().attr('href'),
    audioUrl: $('.download_link.music').attr('href'),
    hdVideo: $('#hd_download').attr('href')
  };
}
