/** Error พร้อม HTTP status code ใช้สร้าง error ที่ควบคุมได้เอง */
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}
