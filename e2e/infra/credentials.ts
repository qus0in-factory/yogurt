import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { resolve } from 'node:path'

export function loginPassword(): string {
  const file = resolve('.env.e2e.local')
  if (!existsSync(file)) throw new Error('E2E: .env.e2e.local 파일과 E2E_LOGIN_PASSWORD 설정이 필요합니다.')
  const value = parseEnv(readFileSync(file, 'utf8')).E2E_LOGIN_PASSWORD
  if (!value?.trim()) throw new Error('E2E: .env.e2e.local의 E2E_LOGIN_PASSWORD가 비어 있습니다.')
  return value
}
