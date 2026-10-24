export async function promptPasswordPair(input = process.stdin, output = process.stdout): Promise<{ password: string; confirmation: string }> {
  const password = await readHidden(input, output, 'LOGIN_PASSWORD: ')
  const confirmation = await readHidden(input, output, 'Confirm LOGIN_PASSWORD: ')
  return { password, confirmation }
}

function readHidden(input: NodeJS.ReadStream, output: NodeJS.WriteStream, label: string): Promise<string> {
  if (!input.isTTY || !input.setRawMode) return Promise.reject(new Error('Interactive terminal required'))
  output.write(label)
  input.setRawMode(true)
  input.resume()
  return new Promise((resolve, reject) => {
    const bytes: number[] = []
    const finish = (error?: Error) => {
      input.off('data', onData)
      input.setRawMode(false)
      input.pause()
      output.write('\n')
      if (error) reject(error)
      else resolve(Buffer.from(bytes).toString('utf8'))
    }
    const onData = (chunk: Buffer | string) => {
      for (const byte of Buffer.from(chunk)) {
        if (byte === 10 || byte === 13) return finish()
        if (byte === 3) return finish(new Error('Password input cancelled'))
        if (byte === 8 || byte === 127) {
          let removed = bytes.pop()
          while (removed !== undefined && (removed & 0xc0) === 0x80) removed = bytes.pop()
        } else bytes.push(byte)
      }
    }
    input.on('data', onData)
  })
}
