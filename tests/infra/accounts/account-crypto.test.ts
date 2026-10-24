// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { decryptText, encryptText, isValidEncryptionKey } from '../../../src/infra/accounts/account-crypto.ts'

const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))

describe('account encryption', () => {
  it('AES-GCM 암호문을 왕복 복호화한다', async () => {
    const stored = await encryptText('secret access key', key)
    expect(stored.split(':')).toHaveLength(3)
    expect(stored.startsWith('v1:')).toBe(true)
    await expect(decryptText(stored, key)).resolves.toBe('secret access key')
  })

  it('같은 평문도 매번 다른 IV와 암호문을 만든다', async () => {
    const first = await encryptText('same', key)
    const second = await encryptText('same', key)
    expect(first).not.toBe(second)
  })

  it('변조되거나 잘못된 형식은 복호화하지 않는다', async () => {
    const stored = await encryptText('secret', key)
    await expect(decryptText(stored.replace(/.$/, 'A'), key)).rejects.toThrow()
    await expect(decryptText('v2:bad:format', key)).rejects.toThrow()
  })

  it('32바이트가 아닌 키는 유효하지 않다', () => {
    expect(isValidEncryptionKey(key)).toBe(true)
    expect(isValidEncryptionKey('bad-key')).toBe(false)
  })
})
