const KIS_TOKEN_URL = 'https://openapi.koreainvestment.com:9443/oauth2/tokenP'

type KisTokenResponse = { access_token: string; expires_in: number }

export async function issueKisToken(fetchFn: typeof fetch, appkey: string, appsecret: string) {
  const response = await fetchFn(KIS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', appkey, appsecret }),
  })
  if (!response.ok) throw new Error('KIS token request failed')
  const body = (await response.json()) as KisTokenResponse
  const expiresAt = Date.now() + body.expires_in * 1000
  return { accessToken: body.access_token, expiresAt, expiresIn: body.expires_in, issued: true }
}

export async function getKisToken(cache: KVNamespace, accountId: string, creds: { accessKey: string; secretKey: string }, fetchFn: typeof fetch, now = Date.now()) {
  const key = `kis-token:${accountId}`
  const cached = await cache.get(key)
  if (cached) {
    const parsed = JSON.parse(cached) as { accessToken: string; expiresAt: number }
    if (parsed.expiresAt > now) return { accessToken: parsed.accessToken, expiresAt: parsed.expiresAt, issued: false }
  }
  const issued = await issueKisToken(fetchFn, creds.accessKey, creds.secretKey)
  const expiresAt = now + issued.expiresIn * 1000
  const expirationTtl = Math.max(60, issued.expiresIn - 600)
  await cache.put(key, JSON.stringify({ accessToken: issued.accessToken, expiresAt }), { expirationTtl })
  return { accessToken: issued.accessToken, expiresAt, issued: true }
}

export async function invalidateKisToken(cache: KVNamespace, accountId: string) {
  await cache.delete(`kis-token:${accountId}`)
}
