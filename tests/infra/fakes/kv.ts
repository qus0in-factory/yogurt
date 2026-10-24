export function createFakeKv(): KVNamespace {
  const store = new Map<string, string>()
  const kv = {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value) },
    delete: async (key: string) => { store.delete(key) },
    list: async () => ({ keys: [] }),
    getWithMetadata: async (key: string) => ({ value: store.get(key) ?? null, metadata: null }),
  }
  return kv as unknown as KVNamespace
}
