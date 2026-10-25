import { z } from 'zod'
import { api } from '../http/http'

export const credentialsSchema = z.object({
  accessKey: z.string().trim().min(1, 'Access Key를 입력하세요'),
  secretKey: z.string().trim().min(1, 'Secret Key를 입력하세요'),
})
export type CredentialsInput = z.infer<typeof credentialsSchema>

export async function replaceCredentials(id: string, input: CredentialsInput): Promise<void> {
  await api.put(`accounts/${encodeURIComponent(id)}/credentials`, { json: credentialsSchema.parse(input) })
}
