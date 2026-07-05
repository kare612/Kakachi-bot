function getFlagApi(countryCode) {
    return `https://flagcdn.com{countryCode.toLowerCase()}.png`;
}

function getVideoDownloadApi(videoUrl) {
    return `https://screenshotlayer.com{encodeURIComponent(videoUrl)}`;
}

async function fetchSearchData(query) {
    try {
        const response = await fetch(`https://duckduckgo.com{encodeURIComponent(query)}&format=json&no_html=1`);
        const data = await response.json();
        return data.AbstractText || "❌ لم يتم العثور على خلاصة موسوعية كافية لهذا الموضوع.";
    } catch (error) {
        return "❌ عذراً، هناك انقطاع مؤقت في خادم جلب الـ API الخارجي للبحث.";
    }
}

module.exports = {
    getFlagApi,
    getVideoDownloadApi,
    fetchSearchData
};

