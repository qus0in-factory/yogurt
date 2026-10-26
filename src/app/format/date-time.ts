import { seoulDateTime } from '../../domain/shared/seoul-time'

export function formatSeoulTime(epochMs: number): string {
  return seoulDateTime(new Date(epochMs)).slice(11)
}
