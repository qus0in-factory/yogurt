import { generateSessionSecret } from '../secrets/session-key.ts'

const secret = await generateSessionSecret()
console.log(secret)
