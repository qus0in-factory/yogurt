import { decryptText } from './account-crypto.ts'

export async function findAccountCredentials(db: D1Database, id: string, keyB64: string) {
  const row = await db.prepare('SELECT access_key_enc, secret_key_enc, account_number, product_code FROM accounts WHERE id = ?').bind(id).first<{ access_key_enc: string; secret_key_enc: string; account_number: string; product_code: string }>()
  if (!row) return null
  try {
    const [accessKey, secretKey] = await Promise.all([
      decryptText(row.access_key_enc, keyB64), decryptText(row.secret_key_enc, keyB64),
    ])
    return { accessKey, secretKey, accountNumber: row.account_number, productCode: row.product_code }
  } catch {
    return null
  }
}
