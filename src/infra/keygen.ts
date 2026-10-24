import { generateSessionSecret } from './session-key.ts'

const secret = await generateSessionSecret()
console.log(secret)
