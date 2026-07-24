// Api By kakachi Dev
// Code By kakachi Dev
// قناة المطور: https://whatsapp.com/channel/0029Vb7EzH0LY6dERNgelG3b
// Vocalremover - إزالة الموسيقى بالذكاء الاصطناعي

import axios from 'axios'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { tmpdir } from 'os'

const execPromise = promisify(exec)

function _r(s) {
  return s.split('+').map(t => t.trim().replace(/[()']/g, '')).join('')
}

const VOCAL_API    = _r("('https') + '://' + 'aivocalremover' + ('.') + 'com'")
const VOCAL_UPLOAD = _r("('https') + '://' + 'aivocalremover' + ('.') + 'com' + '/api/v2/FileUpload'")
const VOCAL_PROCESS = _r("('https') + '://' + 'aivocalremover' + ('.') + 'com' + '/api/v2/ProcessFile'")
const CATBOX_API    = _r("('https') + '://' + 'catbox' + ('.') + 'moe' + '/user/api' + ('.') + 'php'")
const LITTERBOX_API = _r("('https') + '://' + 'litterbox' + ('.') + 'catbox' + ('.') + 'moe' + '/resources/internals/api' + ('.') + 'php'")

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const KEY = 'X9QXlU9PaCqGWpnP1Q4IzgXoKinMsKvMuMn3RYXnKHFqju8VfScRmLnIGQsJBnbZFdcKyzeCDOcnJ3StBmtT9nDEXJn'

async function getMedia(quoted, conn) {
    try {
        if (conn && typeof conn.downloadMediaMessage === 'function') {
            const buf = await conn.downloadMediaMessage(quoted)
            if (buf) return buf
        }

        try {
            const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
            const types = {
                imageMessage: 'image',
                videoMessage: 'video',
                audioMessage: 'audio',
                documentMessage: 'document',
                stickerMessage: 'sticker'
            }
            
            let mtype = quoted.mtype
            if (!mtype && quoted.message) {
                const keys = Object.keys(quoted.message)
                mtype = keys.find(k => k.endsWith('Message'))
            }
            
            const mKind = types[mtype]
            if (mKind) {
                const content = quoted.message?.[mtype] || quoted[mtype]
                if (content) {
                    const stream = await downloadContentFromMessage(content, mKind)
                    const chunks = []
                    for await (const chunk of stream) chunks.push(chunk)
                    return Buffer.concat(chunks)
                }
            }
        } catch (e) {
            console.error('[downloadContentFromMessage] Error:', e.message)
        }

        if (typeof quoted.download === 'function') {
            return await quoted.download()
        }

        throw new Error('تعذّر تحميل الميديا')
    } catch (error) {
        console.error('[getMedia] Error:', error.message)
        throw new Error(`فشل تحميل الملف: ${error.message}`)
    }
}

async function getSession() {
    const res = await fetch(VOCAL_API, { headers: { 'User-Agent': UA } })
    const cookie = (res.headers.get('set-cookie') || '').split(';')[0]
    if (!cookie) throw new Error('فشل الحصول على session')
    return cookie
}

async function uploadFile(buffer, filename, cookie) {
    const form = new FormData()
    const mimeType = filename.endsWith('.mp4') ? 'video/mp4' : 'audio/mpeg'
    form.append('fileName', buffer, { filename: filename, contentType: mimeType })

    const res = await axios.post(VOCAL_UPLOAD, form, {
        headers: {
            'User-Agent': UA,
            'Cookie': cookie,
            'Origin': VOCAL_API,
            'Referer': `${VOCAL_API}/`,
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            ...form.getHeaders()
        },
        timeout: 120000
    })
    
    const data = res.data
    if (data.error || !data.file_name) throw new Error(data.message || 'فشل رفع الملف')
    return data.file_name
}

async function processFile(fileName, cookie) {
    const res = await axios.post(VOCAL_PROCESS, 
        new URLSearchParams({ 
            file_name: fileName, 
            action: 'watermark_video', 
            key: KEY, 
            web: 'web' 
        }),
        {
            headers: {
                'User-Agent': UA,
                'Cookie': cookie,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': VOCAL_API,
                'Referer': `${VOCAL_API}/`,
                'X-Requested-With': 'XMLHttpRequest',
            },
            timeout: 300000
        }
    )
    
    const data = res.data
    if (data.error) throw new Error(data.message || 'فشل استخراج الصوت')
    if (!data.vocal_path || !data.instrumental_path) throw new Error('لم يتم إرجاع روابط الملفات')
    return { vocal: data.vocal_path, instrumental: data.instrumental_path }
}

async function uploadLitterbox(buffer, fileName) {
    const form = new FormData()
    const mimeType = fileName.endsWith('.mp4') ? 'video/mp4' : 'audio/mpeg'
    form.append('reqtype', 'fileupload')
    form.append('time', '72h')
    form.append('fileToUpload', buffer, { filename: fileName, contentType: mimeType })

    const res = await axios.post(LITTERBOX_API, form, {
        headers: { ...form.getHeaders(), 'User-Agent': UA },
        timeout: 120000
    })
    const text = String(res.data).trim()
    if (!text.startsWith('https://')) throw new Error(text)
    return text
}

async function uploadCatboxFromUrl(url) {
    const form = new FormData()
    form.append('reqtype', 'urlupload')
    form.append('url', url)

    const res = await axios.post(CATBOX_API, form, {
        headers: { ...form.getHeaders(), 'User-Agent': UA },
        timeout: 60000
    })
    const text = String(res.data).trim()
    if (!text.startsWith('https://')) throw new Error(text)
    return text
}

async function toCatbox(buffer, fileName) {
    const tempUrl = await uploadLitterbox(buffer, fileName)
    return await uploadCatboxFromUrl(tempUrl)
}

async function downloadUrl(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': UA },
        timeout: 120000
    })
    return Buffer.from(res.data)
}

async function mergeAudioWithVideo(videoBuffer, audioUrl, outputPath) {
    const videoPath = path.join(tmpdir(), `temp_video_${Date.now()}.mp4`)
    fs.writeFileSync(videoPath, videoBuffer)

    const audioBuffer = await downloadUrl(audioUrl)
    const audioPath = path.join(tmpdir(), `temp_audio_${Date.now()}.mp3`)
    fs.writeFileSync(audioPath, audioBuffer)

    const cmd = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}" -y`

    try {
        await execPromise(cmd)
    } catch (error) {
        throw new Error(`فشل دمج الصوت مع الفيديو: ${error.message}`)
    } finally {
        try { fs.unlinkSync(videoPath) } catch {}
        try { fs.unlinkSync(audioPath) } catch {}
    }

    return outputPath
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        const quoted = m.quoted
        const isUrl = args[0] && /^https?:\/\//i.test(args[0])

        if (!quoted && !isUrl) {
            await m.react('❌')
            return m.reply(
                `🎵 *AI Vocal Remover - عزل الصوت من الفيديو*\n\n` +
                `📝 *الاستخدام:*\n` +
                `• رد على *فيديو* بالأمر \`عزل\`\n` +
                `• أو أرسل رابط فيديو مع الأمر\n\n` +
                `💡 *أمثلة:*\n` +
                `\`${usedPrefix}${command}\` (رد على فيديو)\n` +
                `\`${usedPrefix}${command} https://example.com/video.mp4\`\n\n` +
                `📌 *الدعم:* MP4 · MOV · AVI · WEBM\n` +
                `⏱ *الوقت المتوقع:* 30 ثانية إلى 3 دقائق`
            )
        }

        if (quoted) {
            const msg = quoted.message || quoted
            const hasVideo = msg?.videoMessage || msg?.mtype === 'videoMessage'
            const hasAudio = msg?.audioMessage || msg?.mtype === 'audioMessage'

            if (hasAudio && !hasVideo) {
                await m.react('❌')
                return m.reply(`⚠️ *هذا الأمر مخصص للفيديوهات فقط*\n\n📌 *للاستخدام الصحيح:*\n• رد على *فيديو* بالأمر \`عزل\``)
            }

            if (!hasVideo && !isUrl) {
                await m.react('❌')
                return m.reply(`⚠️ *يرجى الرد على فيديو*\n\n📌 *للاستخدام الصحيح:*\n• رد على *فيديو* بالأمر \`عزل\``)
            }
        }

        await m.react('⏳')
        await m.reply('⏳ *جاري المعالجة...*\n_يرجى الانتظار 30 ثانية إلى 3 دقائق_')

        let videoBuffer, fileName
        if (isUrl) {
            await m.reply('📥 جاري تحميل الفيديو من الرابط...')
            videoBuffer = await downloadUrl(args[0])
            const ext = args[0].split('?')[0].split('.').pop() || 'mp4'
            fileName = `video.${ext}`
        } else {
            await m.reply('📥 جاري تحميل الفيديو من الرسالة...')
            videoBuffer = await getMedia(quoted, conn)
            fileName = 'video.mp4'
        }

        if (!videoBuffer || videoBuffer.length === 0) {
            throw new Error('الملف فارغ أو تعذّر تحميله')
        }

        await m.reply(`📤 جاري الرفع (${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB)...`)
        const cookie = await getSession()
        const uploadedFileName = await uploadFile(videoBuffer, fileName, cookie)

        await m.reply('🎙️ جاري استخراج الأصوات...')
        const { vocal, instrumental } = await processFile(uploadedFileName, cookie)

        await m.reply('🎬 جاري دمج الصوت البشري مع الفيديو...\n_قد يستغرق هذا بعض الوقت_')

        const outputPath = path.join(tmpdir(), `output_${Date.now()}.mp4`)
        await mergeAudioWithVideo(videoBuffer, vocal, outputPath)

        const outputBuffer = fs.readFileSync(outputPath)

        await m.reply('💾 جاري رفع الملفات...')
        const instBuffer = await downloadUrl(instrumental)
        let instUrl
        try {
            instUrl = await toCatbox(instBuffer, 'music_only.mp3')
        } catch (_) {
            instUrl = instrumental
        }

        await conn.sendMessage(m.chat, {
            video: outputBuffer,
            caption: `🎬 *تم إزالة الموسيقى من الفيديو*\n\n✅ *النتيجة:* فيديو بالصوت البشري فقط\n📦 *الحجم:* ${(outputBuffer.length / 1024 / 1024).toFixed(1)} MB`,
            mimetype: 'video/mp4'
        }, { quoted: m })

        await conn.sendMessage(m.chat, {
            audio: { url: instUrl },
            mimetype: 'audio/mpeg',
            fileName: 'music_only.mp3',
            caption: '🎸 *الموسيقى التي تم إزالتها*'
        }, { quoted: m })

        try { fs.unlinkSync(outputPath) } catch {}

        await m.reply(`✅ *تم استخراج الصوت بنجاح*`)
        await m.react('✅')

    } catch (e) {
        console.error('Vocal Remover Error:', e)
        await m.react('❌')
        m.reply(`❌ *فشل الاستخراج*\n${e.message || 'خطأ غير معروف'}`)
    }
}

handler.help = ['vocalremover', 'vocal']
handler.tags = ['tools']
handler.command = ['vocalremover', 'vocal', 'vocals', 'instrumental', 'عزل', 'موسيقى']
handler.limit = 2

export default handler
