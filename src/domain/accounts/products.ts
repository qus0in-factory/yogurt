import { z } from 'zod'

export const ACCOUNT_PRODUCTS = [
  { code: '29', key: 'irp', label: 'IRP' },
  { code: '22', key: 'pension', label: '연금저축' },
] as const

export type ProductKey = (typeof ACCOUNT_PRODUCTS)[number]['key']

export const productCodeSchema = z.enum(ACCOUNT_PRODUCTS.map((product) => product.code) as [string, ...string[]])

export const accountProductSchema = z.object({ enabled: z.boolean() })
