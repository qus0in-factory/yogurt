import { z } from 'zod'

export const ACCOUNT_PRODUCTS = [
  { code: '01', key: 'isa', label: 'ISA' },
  { code: '22', key: 'pension', label: '연금저축' },
  { code: '29', key: 'irp', label: 'IRP' },
] as const

export type ProductKey = (typeof ACCOUNT_PRODUCTS)[number]['key']

export const productCodeSchema = z.enum(ACCOUNT_PRODUCTS.map((product) => product.code) as [string, ...string[]])

export const accountProductSchema = z.object({ enabled: z.boolean() })
