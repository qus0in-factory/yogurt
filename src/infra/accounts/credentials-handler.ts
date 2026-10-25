import type { Context } from 'hono'
import { accountCredentialsSchema } from '../../domain/accounts/credentials.ts'
import { encryptText, isValidEncryptionKey } from './account-crypto.ts'
import { invalidateKisToken } from '../kis/kis-token.ts'

type AppContext = Context<{ Bindings: Env }>
const CONFIG_ERROR = { error: 'accounts storage is not configured' }

export async function replaceCredentials(c: AppContext): Promise<Response> {
  const key = c.env.ACCOUNT_ENCRYPTION_KEY
  if (!c.env.DB || !key || !isValidEncryptionKey(key)) return c.json(CONFIG_ERROR, 503)
  const body = await c.req.json().catch(() => null)
  const parsed = accountCredentialsSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid request' }, 400)
  const id = c.req.param('id') as string
  const [accessKeyEnc, secretKeyEnc] = await Promise.all([
    encryptText(parsed.data.accessKey, key),
    encryptText(parsed.data.secretKey, key),
  ])
  const result = await c.env.DB.prepare(
    'UPDATE accounts SET access_key_enc = ?, secret_key_enc = ? WHERE id = ?',
  ).bind(accessKeyEnc, secretKeyEnc, id).run()
  if (result.meta.changes === 0) return c.json({ error: 'account not found' }, 404)
  if (c.env.CACHE) await invalidateKisToken(c.env.CACHE, id)
  return c.body(null, 204)
}
