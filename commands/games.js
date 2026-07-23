export default async function ({ command, reply, sender, userPoints, PREFIX }) {
    // تصفير النقاط تلقائياً إن لم تكن موجودة
    if (!userPoints[sender]) userPoints[sender] = 0;

    switch (command) {
        case 'العاب':
        case 'games':
            return reply(`🎮 *قائمة الألعاب والتسلية المزخرفة:*
            
🪙 [ ${PREFIX}نقاطي ] - معرفة نقاطك الحالية
🎁 [ ${PREFIX}هدية ] - طلب هدية يومية من البوت
🎰 [ ${PREFIX}حظ ] - تجربة عجلة الحظ العشوائية`);

        case 'نقاطي':
            return reply(`🪙 رصيدك الحالي هو: *${userPoints[sender]}* نقطة.\nاستمر بالتفاعل لرفع ترتيبك المطور!`);

        case 'هدية':
            const bonus = Math.floor(Math.random() * 50) + 10;
            userPoints[sender] += bonus;
            return reply(`🎁 مبروك! حصلت على *${bonus}* نقطة هدية مجانية للتفاعل المستمر.`);

        case 'حظ':
            const luck = Math.random() > 0.5;
            const pointsChange = Math.floor(Math.random() * 30) + 5;
            if (luck) {
                userPoints[sender] += pointsChange;
                return reply(`🎰 حظك اليوم رائع! كسبت *${pointsChange}* نقطة إضافية.`);
            } else {
                userPoints[sender] = Math.max(0, userPoints[sender] - pointsChange);
                return reply(`🎰 للأسف خسرت *${pointsChange}* نقطة في عجلة الحظ، جرب مجدداً!`);
            }

        default:
            break;
    }
}
