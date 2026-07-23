const { default: makeWASocket, useMultiFileAuthState, delay, jidNormalizedUser, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const fetch = require('node-fetch');

function _m(s) {
  return s.split('+').map(t => t.trim().replace(/[()']/g, '')).join('');
}

const SEARCH_URL = _m("('https') + '://' + 'search' + ('.') + 'brave' + ('.') + 'com' + '/search");
const DUCKDUCKGO_URL = _m("('https') + '://' + 'html' + ('.') + 'duckduckgo' + ('.') + 'com' + '/html/");
const USER_AGENT = "facebookexternalhit/1.1 (+http://facebook.com)";
const MAX_RESULTS = 10;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const REQUEST_TIMEOUT = 20_000;

const H = `*╮──────────────────⟢ـ*
*⧉┆↜أنـا اسـمـــي ❮ ˹دیــابـلــو˼ ❯*
*⧉┆↜انــا خــادم الـسـیــد يوهان*
*⧉┆↜ قـبــل کــل امــر ضــع ❮ . ❯*
*╯──────────────────⟢ـ*
> *˼📸˹ قـسـم تـحـمـيل ريـلات الانـسـتـا╿↶*
*╮──────────────────⟢ـ*`;

const F = `*╯──────────────────⟢ـ*
> *.¸¸ ❝˼𝐷𝐼𝐴𝐵𝐿𝑂᯽𝐵𝑂𝑇˼❝ ¸¸.*`;

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|'/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function cleanText(value = "") {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function unescapeUrl(value = "") {
  return decodeHtml(value)
    .replace(/\\\//g, "/")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u003d/gi, "=")
    .replace(/\\u0025/gi, "%")
    .replace(/\\"/g, '"');
}

function canonicalInstagramUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!["instagram.com", "www.instagram.com"].includes(url.hostname)) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2 || !["reel", "p", "tv"].includes(parts[0])) return null;
    return `https://instagram.com{parts[0]}/${parts[1]}/`;
  } catch {
    return null;
  }
}

function extractSearchResults(html, limit) {
  const found = [];
  const linkRegex = /href=["'](https:\/\/(?:www\.)?instagram\.com\/(?:reel|p|tv)\/[^"']+)["']/gi;
  let match;

  while ((match = linkRegex.exec(html)) && found.length < limit * 2) {
    const permalink = canonicalInstagramUrl(match[1]);
    if (!permalink) continue;

    const context = html.slice(match.index, match.index + 5_000);
    const titleMatch = /class=["'][^"']*search-snippet-title[^"']*["'][^>]*title=["']([^"']*)["']/i.exec(context) ||
                       /class=["'][^"']*search-snippet-title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(context);
    const descriptionMatch = /class=["'][^"']*generic-snippet[^"']*["'][\s\S]*?class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(context);

    found.push({
      permalink,
      title: cleanText(titleMatch?.[1] || "") || "Instagram Reel",
      description: cleanText(descriptionMatch?.[1] || ""),
    });
  }
  return [...new Map(found.map((item) => [item.permalink, item])).values()].slice(0, limit);
}

function extractDuckDuckGoResults(html, limit) {
  const found = [];
  const resultRegex = /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>([\s\S]{0,5000}?)(?=<div class=["'][^"']*result|<\/body>)/gi;
  let match;

  while ((match = resultRegex.exec(html)) && found.length < limit * 2) {
    try {
      const raw = match[1].startsWith("//") ? `https:${match[1]}` : match[1];
      const searchUrl = new URL(raw);
      const target = searchUrl.searchParams.get("uddg");
      const permalink = canonicalInstagramUrl(target ? decodeURIComponent(target) : raw);
      if (!permalink) continue;

      const snippet = /class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/a>/i.exec(match[3]);
      found.push({
        permalink,
        title: cleanText(match[2]) || "Instagram Reel",
        description: cleanText(snippet?.[1] || ""),
      });
    } catch {}
  }
  return [...new Map(found.map((item) => [item.permalink, item])).values()].slice(0, limit);
}

async function fetchText(url, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
        Referer: "https://google.com",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function readMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return unescapeUrl(cleanText(match[1]));
  }
  return null;
}

function firstMatch(html, patterns) {
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return unescapeUrl(match[1]);
  }
  return null;
}

function findBalancedArray(html, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  return null;
}

function extractJsonArrayAfter(html, propertyName) {
  const markers = [`"${propertyName}"`, `\\"${propertyName}\\"`, propertyName];
  for (const marker of markers) {
    let from = 0;
    while (from < html.length) {
      const markerIndex = html.indexOf(marker, from);
      if (markerIndex < 0) break;
      const start = html.indexOf("[", markerIndex + marker.length);
      if (start >= 0) {
        const raw = findBalancedArray(html, start);
        if (raw) return raw;
      }
      from = markerIndex + marker.length;
    }
  }
  return null;
}

function parseJsonArray(raw) {
  if (!raw) return null;
  const variants = [raw, raw.replace(/\\"/g, '"'), raw.replace(/\\\\/g, "\\").replace(/\\"/g, '"')];
  for (const candidate of variants) {
    try {
      const value = JSON.parse(candidate);
      if (Array.isArray(value)) return value;
    } catch {}
  }
  return null;
}

function extractMediaId(html) {
  return firstMatch(html, [
    /"media_id"\s*:\s*"(\d+)"/i,
    /\\"media_id\\"\s*:\s*\\"(\d+)\\"/i,
    /"mediaId"\s*:\s*"(\d+)"/i,
    /"pk"\s*:\s*"(\d+)"/i,
    /"id"\s*:\s*"(\d+)_\d+"/i,
  ]);
}

function extractDirectVideoUrl(html) {
  const versions = parseJsonArray(extractJsonArrayAfter(html, "video_versions"))
    ?.filter((item) => item && typeof item.url === "string")
    .map((item) => ({ ...item, url: unescapeUrl(item.url) }))
    .filter((item) => item.url.startsWith("http"));

  if (versions?.length) {
    versions.sort((a, b) => {
      const qualityA = Number(a.width || 0) * Number(a.height || 0);
      const qualityB = Number(b.width || 0) * Number(b.height || 0);
      return qualityB - qualityA;
    });
    return versions[0].url;
  }

  return firstMatch(html, [
    /"video_url"\s*:\s*"([^"]+)"/i,
    /\\"video_url\\"\s*:\s*\\"([^"]+)\\"/i,
    /"videoUrl"\s*:\s*"([^"]+)"/i,
  ]);
}

async function scrapeInstagramPage(url) {
  const html = await fetchText(url);
  const videoUrl = extractDirectVideoUrl(html);
  if (videoUrl) {
    return {
      videoUrl,
      title: readMeta(html, "og:title") || readMeta(html, "twitter:title") || "Instagram Reel",
      thumbnailUrl: readMeta(html, "og:image") || readMeta(html, "twitter:image"),
    };
  }
  const mediaId = extractMediaId(html);
  if (!mediaId) throw new Error("Could not parse media details.");
  return await scrapeInstagramPage(`https://instagram.com{mediaId}/embed/captioned/`);
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, 
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = "212784776925";
        await delay(5000);
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log("\n=================================");
            console.log(`🔑 كود الربط الخاص بك هو: ${code}`);
            console.log("=================================\n");
        } catch (error) {
            console.error("❌ حدث خطأ أثناء طلب كود الربط:", error);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ تم تشغيل البوت بنجاح والرد متاح للجميع الآن!');
        } else if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            // تصحيح جلب الرسالة الأولى من المصفوفة لحل مشكلة عدم الرد
            if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
