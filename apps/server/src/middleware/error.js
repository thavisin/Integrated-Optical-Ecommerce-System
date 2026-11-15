/** Error พร้อม HTTP status code ใช้สร้าง error ที่ควบคุมได้เอง */
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}

export function notFound(req, res) {
  res.status(404).json({ message: 'ไม่พบ API ที่ร้องขอ' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.statusCode || err.status || 500
  let message = err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'

  if (err.name === 'MulterError') {
    status = 400
    message = err.code === 'LIMIT_FILE_SIZE' ? 'ไฟล์มีขนาดใหญ่เกิน 5MB' : `การอัปโหลดไฟล์ผิดพลาด: ${err.message}`
  }

  if (err.code === 'P2002') {
    status = 409
    message = 'ข้อมูลนี้มีอยู่ในระบบแล้ว'
  }

  if (status >= 500) console.error(err)
  res.status(status).json({ message })
}
