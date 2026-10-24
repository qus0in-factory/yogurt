async function buildProtocol() {
  const { PublicProtocol } = await import('paseto')
  const v4pub = await import('paseto/v4/public')
  return new PublicProtocol(
    v4pub.GetPublicKeyFactory,
    v4pub.ImportSecretKeyFactory,
    v4pub.SignFactory,
    v4pub.VerifyFactory,
  )
}

let pasetoPromise: Promise<{ v4: Awaited<ReturnType<typeof buildProtocol>> }> | null = null

async function getPaseto() {
  if (!pasetoPromise) {
    pasetoPromise = (async () => ({ v4: await buildProtocol() }))()
  }
  return pasetoPromise
}

export function timingSafeEqualStrings(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)
  let diff = aBytes.length ^ bBytes.length
  const max = Math.max(aBytes.length, bBytes.length)
  for (let i = 0; i < max; i += 1) {
    const x = i < aBytes.length ? aBytes[i] : 0
    const y = i < bBytes.length ? bBytes[i] : 0
    diff |= x ^ y
  }
  return diff === 0
}

export async function isValidSessionSecret(secret: string): Promise<boolean> {
  if (!secret) return false
  try {
    const { v4 } = await getPaseto()
    await v4.ImportSecretKey(secret as `k4.secret.${string}`)
    return true
  } catch {
    return false
  }
}

export async function createSessionToken(secret: string): Promise<string> {
  const { v4 } = await getPaseto()
  const secretKey = await v4.ImportSecretKey(secret as `k4.secret.${string}`)
  return v4.Sign(secretKey, {}, { expiresIn: 7 * 24 * 60 * 60 })
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  if (!secret) return false
  try {
    const { v4 } = await getPaseto()
    const secretKey = await v4.ImportSecretKey(secret as `k4.secret.${string}`)
    const publicKey = await v4.GetPublicKey(secretKey)
    await v4.Verify(publicKey, token)
    return true
  } catch {
    return false
  }
}
