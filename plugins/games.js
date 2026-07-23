export default async function ({ command, reply, sender, userPoints, PREFIX }) {
    switch (command) {
        case 'العاب':
            await reply(`🎮 *قائمة التسلية ونظام النقاط:*
            
🪙 [ ${PREFIX}نقاطي ] - معرفة نقاطك الحالية
🎁 [ ${PREFIX}هدية ] - طلب هدية مجانية يومية`);
            break;

        case 'نقاطي':
            await reply(`🪙 رصيدك الحالي هو: *${userPoints[sender]}* نقطة.`);
            break;

        case 'هدية':
            const bonus = Math.floor(Math.random() * 50) + 10;
            userPoints[sender] += bonus;
            await reply(`🎁 مبروك! حصلت على *${bonus}* نقطة هدية مجانية.`);
            break;

        default:
            break;
    }
}
