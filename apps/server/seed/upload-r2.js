import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// อัปโหลดไฟล์ตัวอย่างใน seed/uploads ขึ้น R2 (local เป็นค่าเริ่มต้น, --remote เมื่อสั่ง)
// ต้องรัน `wrangler dev` หรือ setup ไว้ก่อนถ้าจะใช้ local

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.join(__dirname, '..')
const uploadsRoot = path.join(__dirname, 'uploads')
const BUCKET = 'optimart-uploads'
const remote = process.argv.includes('--remote')

const require = createRequire(import.meta.url)
const wranglerBin = path.join(path.dirname(require.resolve('wrangler/package.json')), 'bin', 'wrangler.js')

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

for (const file of walk(uploadsRoot)) {
  const key = `${BUCKET}/${path.relative(uploadsRoot, file).split(path.sep).join('/')}`
  const contentType = CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream'
  console.log(`⬆️  ${key}${remote ? ' (remote)' : ' (local)'}`)
  execFileSync(
    process.execPath,
    [wranglerBin, 'r2', 'object', 'put', key, '--file', file, '--content-type', contentType, remote ? '--remote' : '--local'],
    { stdio: 'inherit', cwd: serverRoot },
  )
}

console.log(`✅ Uploaded seed files to R2 (${remote ? 'remote' : 'local'})`)
