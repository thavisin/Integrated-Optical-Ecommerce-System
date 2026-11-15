import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsRoot = path.join(__dirname, '..', '..', 'public', 'uploads')

function storage(subdir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(uploadsRoot, subdir)
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase()
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`)
    },
  })
}

function fileFilter(req, file, cb) {
  const isImage = /^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.mimetype)
  const isPdf = file.mimetype === 'application/pdf'
  if (isImage || isPdf) cb(null, true)
  else {
    const err = new Error('แนบได้เฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, GIF) หรือ PDF เท่านั้น')
    err.statusCode = 400
    cb(err)
  }
}

/** อัปโหลดสลิปโอนเงิน → public/uploads/slips */
export const uploadSlip = multer({
  storage: storage('slips'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

/** อัปโหลดรูปสินค้า → public/uploads/products */
export const uploadProduct = multer({
  storage: storage('products'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})
