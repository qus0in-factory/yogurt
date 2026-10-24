import { spawnSync } from 'node:child_process'
import { generateSessionSecret } from './session-key.ts'
import { createBulkPayload, resolveTarget, validateLoginPassword } from '../domain/secret-setup.ts'

type ExecResult = { status?: number | null; error?: unknown }
type Executor = (command: string, args: string[], options: { input: string }) => ExecResult

const USAGE = 'Usage: LOGIN_PASSWORD=<password> pnpm run secret:setup -- <dev|main>'

export async function runSecretSetup(
  target: string | undefined,
  loginPassword: string | undefined,
  deps: { generateSecret?: () => Promise<string>; exec?: Executor } = {},
): Promise<{ exitCode: 0 | 1 | 2; message: string }> {
  const resolved = resolveTarget(target)
  if (!resolved) return { exitCode: 2, message: USAGE }

  const passwordError = validateLoginPassword(loginPassword)
  if (passwordError) return { exitCode: 2, message: USAGE }

  const secret = await (deps.generateSecret ?? generateSessionSecret)()
  const payload = createBulkPayload(loginPassword ?? '', secret)
  const exec = deps.exec ?? defaultExec
  const result = exec('wrangler', ['secret', 'bulk', '--config', 'infra/wrangler.jsonc', '--env', resolved.env], { input: payload })
  if (result?.error || result?.status !== 0) {
    return { exitCode: 1, message: 'wrangler secret bulk failed' }
  }

  return {
    exitCode: 0,
    message: `Registered LOGIN_PASSWORD, SESSION_SECRET for ${resolved.target} (${resolved.env}). Existing sessions invalidated.`,
  }
}

function defaultExec(command: string, args: string[], options: { input: string }): ExecResult {
  return spawnSync(command, args, { input: options.input, stdio: ['pipe', 'inherit', 'inherit'] })
}
