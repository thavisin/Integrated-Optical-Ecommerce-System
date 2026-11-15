import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from './password.js'

const hash = await hashPassword('s3cret!')
assert.match(hash, /^pbkdf2\$100000\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/)
assert.equal(await verifyPassword('s3cret!', hash), true)
assert.equal(await verifyPassword('wrong', hash), false)
assert.equal(await verifyPassword('s3cret!', 'not-a-hash'), false)
assert.equal(await verifyPassword('s3cret!', ''), false)

console.log('password.test.js OK')
