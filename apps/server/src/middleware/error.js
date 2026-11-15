export const notFound = (c) => c.json({ message: 'ไม่พบ API ที่ร้องขอ' }, 404)

export const onError = (err, c) => {
  let status = err.statusCode || err.status || 500
  let message = err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'

  const raw = String(err?.message || '')
  if (/UNIQUE constraint failed/i.test(raw)) {
    status = 409
    message = 'ข้อมูลนี้มีอยู่ในระบบแล้ว'
  }
  if (/CHECK constraint failed/i.test(raw)) {
    status = 400
    message = 'สต็อกสินค้าไม่เพียงพอ'
  }

  if (status >= 500) console.error(err)
  return c.json({ message }, status)
}
