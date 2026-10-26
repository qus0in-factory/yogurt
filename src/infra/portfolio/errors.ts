import type { ZodError } from 'zod'

export type ApiIssue = { path: string; reason: string }

export function issuesOf(error: ZodError): ApiIssue[] {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), reason: issue.message }))
}

export function isForeignKeyError(error: unknown): boolean {
  return error instanceof Error && /FOREIGN KEY|foreign key/i.test(error.message)
}

export function isUniqueError(error: unknown): boolean {
  return error instanceof Error && /UNIQUE|unique/i.test(error.message)
}
