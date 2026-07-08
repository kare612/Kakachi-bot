const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    Browsers,
    getContentType
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

async function startKakashiBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session_kakashi');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, 
        auth: state,
        browser: Browsers.macOS('Chrome') 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (!sock.authState.creds.registered) {
            const botNumber = "212784776925"; 

            if (connection === 'connecting' || qr) {
                setTimeout(async () => {
                    try {
                        console.log(`\n[⏳] Requesting Pairing Code for: +${botNumber}...`);
                        const pairingCode = await sock.requestPairingCode(botNumber);
                        
                        console.log(`\n========================================`);
                        console.log(`🔮 YOUR KAKASHI BOT PAIRING CODE IS:`);
                        console.log(`👉  \x1b[32m\x1b[1m${pairingCode}\x1b[0m  👈`); 
                        console.log(`========================================`);
                        console.log(`Go to WhatsApp -> Linked Devices -> Link with phone number and enter this code.\n`);
                    } catch (error) {
                        console.error("[❌] Failed to get pairing code:", error.message);
                    }
                }, 7000); 
            }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[⚠️] Connection closed. Reconnecting...');
            if (shouldReconnect) startKakashiBot();
        } else if (connection === 'open') {
            console.log('\n========================================');
            console.log('[✅] Kakashi-Bot is Connected Successfully!');
            console.log('========================================\n');
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages;
            if (!mek.message || mek.key.fromMe) return;

            const from = mek.key.remoteJid;
            const type = getContentType(mek.message);
            const body = (type === 'conversation') ? mek.message.conversation : 
                         (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';

            const prefix = '.'; 
            if (!body.startsWith(prefix)) return;

            const args = body.trim().split(/ +/).slice(1);
            const commandName = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

            if (fs.existsSync('./commands.js')) {
                const commands = require('./commands.js');
                if (commands[commandName]) {
                    await commands[commandName](sock, mek, from, args);
                }
            }
        } catch (err) {
            console.error("Error processing message:", err);
        }
    });
}

startKakashiBot();
        
