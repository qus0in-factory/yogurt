import { runSecretSetup } from './secret-setup.ts'

const target = process.argv[2]
const result = await runSecretSetup(target, process.env.LOGIN_PASSWORD)
if (result.exitCode !== 0) {
  console.error(result.message)
  process.exit(result.exitCode)
}
console.log(result.message)
