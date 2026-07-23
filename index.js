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

// إعدادات البوت الأساسية
const DEVELOPER_NUMBER = "212784776925"; 
const BOT_NAME = "𝙆𝘼𝙆𝘼𝘾𝙃𝙄-𝘽𝙊𝙏";
const OWNER_NAME = "𝙆𝘼𝙆𝘼𝘾𝙃𝙄";
const PREFIX = ".";

const userPoints = {};

async function startBot() {
    if (!fs.existsSync('./session')) {
        fs.mkdirSync('./session');
    }

    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket.default ? makeWASocket.default({
        version, logger: pino({ level: 'silent' }), printQRInTerminal: false, auth: state, browser: ["Ubuntu", "Chrome", "20.0.04"]
    }) : makeWASocket({
        version, logger: pino({ level: 'silent' }), printQRInTerminal: false, auth: state, browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        console.log(`\n[ ℹ️ ] جاري طلب كود الربط للرقم: ${DEVELOPER_NUMBER}`);
        await delay(5000); 
        try {
            let code = await sock.requestPairingCode(DEVELOPER_NUMBER);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(`\n🔑 كود الربط الخاص بك هو: ${code}\n`);
        } catch (error) { console.error("❌ فشل كود الربط:", error); }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const errorOutput = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output;
            const statusCode = errorOutput ? errorOutput.statusCode : null;
            if (statusCode !== DisconnectReason.loggedOut) startBot();
        } else if (connection === 'open') {
            console.log(`\n✅ [ ${BOT_NAME} ] متصل ومستقر بنسبة 100%!`);
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

            if (!userPoints[sender]) userPoints[sender] = 0;
            userPoints[sender] += 1;

            const reply = async (text) => {
                await sock.sendMessage(from, { text: `╭━━〔 ${BOT_NAME} 〕━━╮\n\n${text}\n\n╰━━━━━━━━━━━━━━╯` }, { quoted: mek });
            };

            // قراءة الأوامر من مجلد plugins وتمريرها بشكل صحيح ومباشر
            const pluginsFolder = path.resolve('./plugins');
            if (fs.existsSync(pluginsFolder)) {
                const files = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js'));
                
                for (const file of files) {
                    const filePath = path.join(pluginsFolder, file);
                    const fileUrl = pathToFileURL(filePath).href;
                    const plugin = await import(fileUrl);
                    
                    if (plugin.default && typeof plugin.default === 'function') {
                        // تمرير كافة المتغيرات المطلوبة لتشغيل الأوامر والـ APIs بنجاح
                        await plugin.default({
                            command, args, isOwner, reply, DEVELOPER_NUMBER, 
                            BOT_NAME, OWNER_NAME, PREFIX, sock, from, sender, mek, userPoints
                        });
                    }
                }
            }

        } catch (err) { console.error("Error: ", err); }
    });
}

startBot().catch(err => console.error(err));
                
