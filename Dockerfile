FROM node:18

# إنشاء مجلد العمل داخل السيرفر
WORKDIR /app

# نسخ ملفات الحزم وتثبيتها
COPY package*.json ./
RUN npm install

# نسخ باقي ملفات البوت
COPY . .

# أمر تشغيل البوت (تأكد من اسم الملف الأساسي للبوت، مثلاً index.js أو bot.js)
CMD ["node", "index.js"]
