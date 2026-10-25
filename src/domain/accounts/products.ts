import { z } from 'zod'

export const ACCOUNT_PRODUCTS = [{ code: '29', key: 'irp', label: 'IRP' }] as const

export const productCodeSchema = z.enum(ACCOUNT_PRODUCTS.map((product) => product.code) as [string, ...string[]])

export const accountProductSchema = z.object({ enabled: z.boolean() })
