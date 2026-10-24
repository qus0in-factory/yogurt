export function readSessionJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as T)
  } catch {
    return null
  }
}

export function writeSessionJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 초안 저장 실패는 보조 기능이므로 무시한다 */
  }
}

export function removeSession(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* 무시 */
  }
}
