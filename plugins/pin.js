const imgCommand = require('./img');

module.exports = {
    name: 'pin',
    aliases: ['بنترست', 'pinterest'],
    async execute(sock, m, args, remoteJid) {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(remoteJid, { text: '❌ اكتب وصف الخلفية. مثال: `.pin naruto`' }, { quoted: m });
        }

        await imgCommand.execute(sock, m, [query, 'pinterest', 'wallpaper'], remoteJid);
    }
};
