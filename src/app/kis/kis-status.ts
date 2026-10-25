import { z } from 'zod'

const kisStatusSchema = z.object({
  accountId: z.string(),
  status: z.enum(['connected', 'error']),
  expiresAt: z.number().optional(),
})

export type KisStatus = z.infer<typeof kisStatusSchema>

/** SSE 'status' 이벤트의 raw data(JSON 문자열)를 검증한다. ping·오류·형식 불일치는 null이다. */
export function parseKisStatus(data: string): KisStatus | null {
  try {
    return kisStatusSchema.parse(JSON.parse(data))
  } catch {
    return null
  }
}
