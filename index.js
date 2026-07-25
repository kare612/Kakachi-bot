import { Client } from 'meowsab';
import { group, access } from "./system/control.js";
import UltraDB from "./system/UltraDB.js";
import sub from './sub.js';

/* =========== Client ========== */
const client = new Client({
  phoneNumber: '212784776925', // رقم البوت الخاص بك
  prefix: [".", "/", "!"],
  fromMe: false, 
  usePairingCode: true, // تفعيل طلب كود التحقق (Pairing Code)
  owners: [
    { name: "KAKACHI", jid: "212784776925@s.whatsapp.net" } // رقمك كمطور أساسي
  ],
  settings: { noWelcome: false },
  commandsPath: './plugins'
});

client.onGroupEvent(group);
client.onCommandAccess(access);

/* =========== Database ========== */
if (!global.db) {
    global.db = new UltraDB();
}

/* =========== Config ========== */
const { config } = client;
config.info = { 
  nameBot: "🥷 𝙆𝘼𝙆𝘼𝘾𝙃𝙄 𝘽𝙊𝙏 ⚡", // تم تغيير اسم البوت هنا
  nameChannel: "", 
  idChannel: "", // تم إزالة معرف القناة
  urls: {
    repo: "https://github.com",
    api: "https://emam-api.web.id",
    channel: "" // تم إزالة رابط القناة
  },
  copyright: { 
    pack: '𝙆𝘼𝙆𝘼𝘾𝙃𝙄', // تم تعديل الحقوق
    author: '𝙆𝘼𝙆𝘼𝘾𝙃𝙄'
  },
  images: [
    "https://pinimg.com",
    "https://pinimg.com",
    "https://pinimg.com"
  ]
};

/* =========== Start ========== */
client.start();

setTimeout(async () => {
if (client.commandSystem) { 
sub(client)
  }
}, 2000);


/* =========== Catch Errors ========== */
process.on('uncaughtException', (e) => {
    if (e.message.includes('rate-overlimit')) {}
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
});
