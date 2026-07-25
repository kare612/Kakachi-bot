const insta = async (m, { text, Api, conn }) => {
  if (!text) return m.reply("❌: حط الرابط جنب الامر");
  
  const { status, data } = await Api.download.instagram ({ url: text })
  
  try {
    if (status !== 'success') {
      return m.react("❌");
    }

    if (Array.isArray(data)) {
      let thumbnail;
      let video;
      
      for (let item of data) {
        if (item.type === "thumbnail") {
          thumbnail = item.url;
        } else if (item.type === "video") {
          video = item.url;
        }
      }
      
      if (thumbnail) {
        await conn.sendMessage(m.chat, { 
          image: { url: thumbnail },
          caption: "```Instagram preview image```"
        });
      }
      
      if (video) {
        await conn.sendMessage(m.chat, { 
          video: { url: video }, 
          caption: "```📥 Instagram video downloaded successfully```"
        });
      } else {
        m.reply("❌ No video found in this Instagram post");
      }
    }
  } catch (error) {
    console.error(error.message);
    m.reply(error.message);
  }
};
insta.usage = ["انستا"];
insta.category = "downloads";
insta.command = ["انستا", "instagram", "ig"];
insta.admin = false;
export default insta;
