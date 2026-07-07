// استدعاء الملفات الجديدة من مجلد commands
const adminCmd = require('./commands/admin.js');
const gamesCmd = require('./commands/games.js');

// داخل دالة معالجة النصوص (Switch/Case):
switch (command) {
    // أوامر الإدارة
    case 'طرد':
    case 'رفع':
    case 'خفض':
    case 'قفل':
    case 'فتح':
        await adminCmd.manage(sock, from, command, msg);
        break;

    // أوامر الألعاب والترفيه
    case 'كت_تويت':
    case 'فعالية':
    case 'فعاليات':
    case 'نسبة_الحب':
        await gamesCmd.play(sock, from, command);
        break;
}
