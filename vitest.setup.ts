import { beforeEach } from "vitest";

// The ticket store persists via zustand `persist` (localStorage) and clears it directly.
// The "node" test environment has no DOM, so provide a minimal in-memory Storage implementation.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) =>
      store.has(key) ? (store.get(key) as string) : null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  } as Storage;
}

const localStorageImpl = createMemoryStorage();
const sessionStorageImpl = createMemoryStorage();

globalThis.localStorage = localStorageImpl;
globalThis.sessionStorage = sessionStorageImpl;
// zustand's `persist` middleware reads `window.localStorage`, so expose a minimal window too,
// otherwise persistence silently no-ops (and logs "storage is currently unavailable").
globalThis.window = {
  localStorage: localStorageImpl,
  sessionStorage: sessionStorageImpl,
  isSecureContext: true,
} as unknown as Window & typeof globalThis;

beforeEach(() => {
  localStorageImpl.clear();
  sessionStorageImpl.clear();
});
