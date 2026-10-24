const encoder = new TextEncoder()

export const SESSION_TTL_SECONDS = 604800

async function sessionKey(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `session:${hex}`
}

export async function saveSession(kv: KVNamespace, token: string): Promise<void> {
  await kv.put(await sessionKey(token), '1', { expirationTtl: SESSION_TTL_SECONDS })
}

export async function hasSession(kv: KVNamespace, token: string): Promise<boolean> {
  return (await kv.get(await sessionKey(token))) !== null
}

export async function deleteSession(kv: KVNamespace, token: string): Promise<void> {
  await kv.delete(await sessionKey(token))
}
