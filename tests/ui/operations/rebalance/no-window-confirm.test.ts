import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function collectUiFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectUiFiles(fullPath))
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath)
  }
  return files
}

describe('no window.confirm or alert in src/ui', () => {
  it('src/ui 디렉터리 내 모든 파일에 confirm/alert 호출이 없다', () => {
    const uiDir = path.resolve(__dirname, '../../../../src/ui')
    const files = collectUiFiles(uiDir)
    const callPattern = /(?:window\s*\.\s*(?:confirm|alert)|(?<![.\w])(?:confirm|alert)\s*\()/
    const violations: Array<{ file: string; line: number; text: string }> = []

    for (const file of files) {
      const lines = fs.readFileSync(file, 'utf-8').split('\n')
      lines.forEach((line, idx) => {
        // 주석 제외
        const trimmed = line.trim()
        if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return
        if (callPattern.test(line)) {
          violations.push({ file: path.relative(uiDir, file), line: idx + 1, text: trimmed })
        }
      })
    }

    expect(violations).toEqual([])
  })
})
