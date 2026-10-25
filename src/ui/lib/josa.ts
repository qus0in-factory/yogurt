export function withObjectParticle(word: string): string {
  if (!word) return ''

  const last = word.charAt(word.length - 1)
  const code = last.charCodeAt(0)
  const hasFinal = code >= 0xAC00 && code <= 0xD7A3
    ? (code - 0xAC00) % 28 !== 0
    : /^[LMNR013678]$/i.test(last)

  return `${word}${hasFinal ? '을' : '를'}`
}
