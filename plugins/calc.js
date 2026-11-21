module.exports = {
    name: 'calc',
    aliases: ['حاسبة', 'احسب'],
    async execute(sock, m, args, remoteJid) {
        const expr = args.join('').replace(/[^0-9+\-*/().]/g, '');
        if (!expr) return sock.sendMessage(remoteJid, { text: '❌ اكتب العملية الحسابية بعد الأمر. مثال: `.calc 25*4`' }, { quoted: m });

        try {
            const result = Function(`"use strict";return (${expr})`)();
            await sock.sendMessage(remoteJid, { text: `🧮 *العملية:* ${expr}\n🌑 *النتيجة:* *${result}*` }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ صيغة العملية الحسابية غير صحيحة.' }, { quoted: m });
        }
    }
};
      
