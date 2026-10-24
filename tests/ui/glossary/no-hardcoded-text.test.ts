import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = join(__dirname, '..', '..', '..', 'src', 'ui')

function walk(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'glossary') continue
      files.push(...walk(full))
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      files.push(full)
    }
  }
  return files
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

function hasKoreanLiteral(code: string): boolean {
  const stripped = stripComments(code)
  const regex = /(['"`])(?:\\.|(?!\1).)*\1/g
  for (const match of stripped.matchAll(regex)) {
    if (/[가-힣]/.test(match[0])) return true
  }
  return false
}

describe('no hardcoded Korean text literals', () => {
  it('glossary 밖 src/ui 파일에 한글 문자열 리터럴이 없다', () => {
    const offenders: string[] = []
    for (const file of walk(root)) {
      if (hasKoreanLiteral(readFileSync(file, 'utf8'))) offenders.push(file)
    }
    const names = offenders.map((file) => relative(root, file)).sort()
    expect(names).toEqual([])
  })
})
