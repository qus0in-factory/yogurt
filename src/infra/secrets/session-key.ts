export async function generateSessionSecret(): Promise<string> {
  const { PublicProtocol } = await import('paseto')
  const v4pub = await import('paseto/v4/public')
  const v4 = new PublicProtocol(v4pub.ExportSecretKeyFactory, v4pub.GenerateKeyPairFactory)
  const { secretKey } = await v4.GenerateKeyPair({ extractable: true })
  return v4.ExportSecretKey(secretKey)
}
