module.exports = {
    name: 'weather',
    aliases: ['طقس', 'الطقس'],
    async execute(sock, m, args, remoteJid) {
        const city = args.join(' ');
        if (!city) return sock.sendMessage(remoteJid, { text: '❌ اكتب اسم المدينة بعد الأمر. مثال: `.طقس الناظور`' }, { quoted: m });

        try {
            const api = new URL('https://wttr.in' + encodeURIComponent(city));
            api.searchParams.set('format', 'j1');
            api.searchParams.set('lang', 'ar');

            const res = await fetch(api.href);
            const data = await res.json();
            const current = data.current_condition.at(0);
            const desc = current.lang_ar?.at(0)?.value || current.weatherDesc.at(0).value;

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
