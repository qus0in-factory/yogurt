import { runSecretSetup } from './secret-setup.ts'
import { promptPasswordPair } from './password-prompt.ts'

const args = process.argv.slice(2)
const target = args.length > 1 ? '' : args[0]
const result = await runSecretSetup(target, process.env.LOGIN_PASSWORD, { promptPassword: promptPasswordPair })
if (result.exitCode !== 0) {
  console.error(result.message)
  process.exit(result.exitCode)
}
console.log(result.message)
