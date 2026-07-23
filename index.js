import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay, 
    fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const DEVELOPER_NUMBER = "212784776925"; 
const BOT_NAME = "𝙆𝘼𝙆𝘼𝘾𝙃𝙄-𝘽𝙊𝙏";
const OWNER_NAME = "𝙆𝘼𝙆𝘼𝘾𝙃𝙄";
const PREFIX = ".";

// نظام نقاط مخزن مؤقتاً
const userPoints = {};

async function startBot() {
    if (!fs.existsSync('./session')) {
        fs.mkdirSync('./session');
    }

    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, 
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        console.log(`\n=========================================`);
        console.log(`[ ℹ️ ] جاري طلب كود الربط للرقم: ${DEVELOPER_NUMBER}`);
        console.log(`=========================================\n`);
        await delay(5000); 
        try {
            let code = await sock.requestPairingCode(DEVELOPER_NUMBER);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(`\n┌────────────────────────────────────────┐`);
            console.log(`│ 🔑 كود الربط الخاص بك هو: ${code} │`);
            console.log(`└────────────────────────────────────────┘\n`);
        } catch (error) {
            console.error("❌ فشل في طلب كود الربط:", error);
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const errorOutput = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output;
            const statusCode = errorOutput ? errorOutput.statusCode : null;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log(`\n✅ تم اتصال [ ${BOT_NAME} ] بنجاح وهو جاهز لاستقبال الأوامر!`);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message || mek.key.fromMe) return;

            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];
            
            let body = "";
            if (type === 'conversation') body = mek.message.conversation;
            else if (type === 'extendedTextMessage') body = mek.message.extendedTextMessage.text;
            else if (type === 'imageMessage') body = mek.message.imageMessage.caption;
            else if (type === 'videoMessage') body = mek.message.videoMessage.caption;

            if (!body || !body.startsWith(PREFIX)) return;

            const args = body.trim().split(/ +/).slice(1);
            const command = body.slice(PREFIX.length).trim().split(/ +/).shift().toLowerCase();
            const sender = mek.key.participant || mek.key.remoteJid;
            const isOwner = sender.includes(DEVELOPER_NUMBER);

            // تفعيل نقاط التفاعل
            if (!userPoints[sender]) userPoints[sender] = 0;
            userPoints[sender] += 1;

            const reply = async (text) => {
                await sock.sendMessage(from, { text: `╭━━〔 ${BOT_NAME} 〕━━╮\n\n${text}\n\n╰━━━━━━━━━━━━━━╯` }, { quoted: mek });
            };

            // قراءة وتشغيل الأوامر تلقائياً من مجلد "الأوامر" (تم إصلاح المسار بالكامل هنا)
            const commandsFolder = path.resolve('./الأوامر');
            if (fs.existsSync(commandsFolder)) {
                const files = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
                
                for (const file of files) {
                    const filePath = path.join(commandsFolder, file);
                    const fileUrl = pathToFileURL(filePath).href; // تحويل المسار إلى صيغة متوافقة مع import دلالي
                    
                    const commandFile = await import(fileUrl);
                    
                    if (commandFile.default && typeof commandFile.default === 'function') {
                        await commandFile.default({
                            command, args, isOwner, reply, DEVELOPER_NUMBER, 
                            BOT_NAME, OWNER_NAME, PREFIX, sock, from, sender, mek, userPoints
                        });
                    }
                }
            }

        } catch (err) {
            console.error("Error in execution: ", err);
        }
    });
}

startBot().catch(err => console.error("خطأ حرج:", err));
            
