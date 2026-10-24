import { spawnSync } from 'node:child_process'
import { generateSessionSecret } from './session-key.ts'
import { createBulkPayload, resolveTargets, validateLoginPassword } from '../domain/secret-setup.ts'

type ExecResult = { status?: number | null; error?: unknown }
type Executor = (command: string, args: string[], options: { input: string }) => ExecResult
type PasswordPair = { password: string; confirmation: string }
type SetupDeps = { generateSecret?: () => Promise<string>; exec?: Executor; promptPassword?: () => Promise<PasswordPair> }
const USAGE = 'Usage: pnpm run secret:setup [-- dev|main]'

export async function runSecretSetup(target: string | undefined, loginPassword: string | undefined, deps: SetupDeps = {}): Promise<{ exitCode: 0 | 1 | 2; message: string }> {
  const targets = resolveTargets(target)
  if (!targets) return { exitCode: 2, message: USAGE }
  let password = loginPassword
  let confirmation: string | undefined
  if (password === undefined) {
    if (!deps.promptPassword) return { exitCode: 2, message: USAGE }
    try { ({ password, confirmation } = await deps.promptPassword()) }
    catch { return { exitCode: 2, message: 'Unable to read LOGIN_PASSWORD.' } }
  }
  const passwordError = validateLoginPassword(password, confirmation)
  if (passwordError) return { exitCode: 2, message: `${passwordError}. ${USAGE}` }

  const registered: string[] = []
  for (const resolved of targets) {
    try {
      const secret = await (deps.generateSecret ?? generateSessionSecret)()
      const payload = createBulkPayload(password ?? '', secret)
      const result = (deps.exec ?? defaultExec)('wrangler', ['secret', 'bulk', '--config', 'infra/wrangler.jsonc', '--env', resolved.env], { input: payload })
      if (result?.error || result?.status !== 0) throw new Error('registration failed')
      registered.push(resolved.target)
    } catch {
      return { exitCode: 1, message: `Secret setup failed for ${resolved.target}; registered: ${registered.join(', ') || 'none'}.` }
    }
  }
  return { exitCode: 0, message: `Registered LOGIN_PASSWORD and SESSION_SECRET for ${targets.map(item => `${item.target} (${item.env})`).join(', ')}. Existing sessions invalidated.` }
}

function defaultExec(command: string, args: string[], options: { input: string }): ExecResult {
  return spawnSync(command, args, { input: options.input, stdio: ['pipe', 'inherit', 'inherit'] })
}
