// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { generateSessionSecret } from '../../../src/infra/secrets/session-key.ts'

describe('session key', () => {
  it('k4.secret PASERK를 생성한다', async () => {
    const secret = await generateSessionSecret()
    expect(secret.startsWith('k4.secret.')).toBe(true)
  })
})
