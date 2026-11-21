module.exports = {
    name: 'weather',
    aliases: ['طقس', 'الطقس'],
    async execute(sock, m, args, remoteJid) {
        const city = args.join(' ');
        if (!city) return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم المدينة بعد الأمر. مثال: `.طقس الناظور`' }, { quoted: m });

        try {
            const res = await fetch(`https://wttr.in{encodeURIComponent(city)}?format=j1&lang=ar`);
            const data = await res.json();
            const current = data.current_condition[0];
            const desc = current.lang_ar?.[0]?.value || current.weatherDesc[0].value;
            const text = `🌦️ *حالة الطقس في (${city}):*\n\n` +
                         `🌡️ *الحرارة:* ${current.temp_C}°C\n` +
                         `☁️ *الحالة:* ${desc}\n` +
                         `💧 *الرطوبة:* ${current.humidity}%\n` +
                         `💨 *سرعة الرياح:* ${current.windspeedKmph} كم/س`;
            await sock.sendMessage(remoteJid, { text }, { quoted: m });
        } catch {
            await sock.sendMessage(remoteJid, { text: '❌ لم أتمكن من العثور على هذه المدينة.' }, { quoted: m });
        }
    }
};
