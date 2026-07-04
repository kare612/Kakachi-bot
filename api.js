/**
 * ملف إدارة الـ APIs والمحركات الخارجية لكاكاشي بوت
 */

// 1. رابط جلب ميديا صور أعلام الدول للألعاب التفاعلية
function getFlagApi(countryCode) {
    return `https://flagcdn.com{countryCode.toLowerCase()}.png`;
}

// 2. رابط جلب وتحميل الفيديوهات عبر الـ API المباشر
function getVideoDownloadApi(videoUrl) {
    return `https://screenshotlayer.com{encodeURIComponent(videoUrl)}`;
}

// 3. دالة الاتصال بالويب وجلب خلاصة الموسوعات للبحث الذكي
async function fetchSearchData(query) {
    try {
        const response = await fetch(`https://duckduckgo.com{encodeURIComponent(query)}&format=json&no_html=1`);
        const data = await response.json();
        return data.AbstractText || "❌ لم أجد خلاصة موسوعية كافية لهذا الموضوع، يرجى كتابة موضوع بحث آخر بدقة.";
    } catch (error) {
        console.error("خطأ خادم البحث الـ API:", error);
        return "❌ عذراً، هناك انقطاع مؤقت في خادم جلب الـ API الخارجي للبحث.";
    }
}

module.exports = {
    getFlagApi,
    getVideoDownloadApi,
    fetchSearchData
};
