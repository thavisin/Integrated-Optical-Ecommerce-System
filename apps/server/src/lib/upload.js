import { HttpError } from './http.js'

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
  'application/pdf',
])
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/** อ่าน body ได้ทั้ง JSON, multipart/form-data และ urlencoded (เหมือน express.json + multer) */
export async function readBody(c) {
  const contentType = c.req.header('content-type') || ''
  if (contentType.includes('application/json')) {
    const text = await c.req.text()
    if (!text) return {}
    try {
      return JSON.parse(text)
    } catch {
      throw new HttpError(400, 'รูปแบบข้อมูลไม่ถูกต้อง')
    }
  }
  return await c.req.parseBody()
}

export function fileFrom(body, field) {
  const value = body?.[field]
  return typeof File !== 'undefined' && value instanceof File ? value : null
}

function extensionOf(name) {
  const base = String(name || '').split('/').pop()
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(dot).toLowerCase() : '.jpg'
}

function randomHex(bytes) {
  const values = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(values, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * ตรวจไฟล์ (ชนิด/ขนาด) แล้วอัปโหลดขึ้น R2
 * คืน URL รูปแบบเดิม /uploads/<subdir>/<filename>
 */
export async function saveUpload(env, file, subdir) {
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(400, 'ไฟล์มีขนาดใหญ่เกิน 5MB')
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new HttpError(400, 'แนบได้เฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, GIF) หรือ PDF เท่านั้น')
  }

  const key = `${subdir}/${Date.now()}-${randomHex(4)}${extensionOf(file.name)}`
  await env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  })
  return `/uploads/${key}`
}
