const handler = async (m, { conn }) => {
  const start = process.hrtime.bigint();
  await conn.sendMessage(m.chat, { text: "🏓 msg test" });
  const end = process.hrtime.bigint();
  const ping = Number(end - start) / 1e6;
  
  await conn.msgUrl(m.chat, `⚡ سرعة البوت: ${ping.toFixed(2)}ms`, {
    img: "https://i.pinimg.com/736x/73/56/32/735632c6fa8e665c249abbc8a340b77d.jpg",
    title: "𝐒𝐩𝐞𝐞𝐝 / 𝐓𝐞𝐬𝐭",
    body: "𝐓𝐞𝐬𝐭𝐢𝐧𝐠 𝐭𝐡𝐞 𝐛𝐨𝐭'𝐬 𝐬𝐩𝐞𝐞𝐝: 𝐈𝐬 𝐢𝐭 𝐟𝐚𝐬𝐭 𝐨𝐫 𝐧𝐨𝐭?",
    newsletter: {
      name: '𝐕𝐈𝐈7 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🕷️',
      jid: 'بدون تشغيل'
    },
    big: false
  }, global.reply_status);
};

handler.command = ["بنج", "ping"];
handler.category = "info";
handler.usage = ["بنج"];
export default handler;
