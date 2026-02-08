// Lightweight dynamic mock registry used by tests to provide modules for `next/dynamic`.
// Keep the implementation minimal and robust: accept any module shape, avoid React imports,
// deduplicate candidate lookups, and auto-reset between tests when running under Jest.

type DynamicModule = any;

type ResolveOptions = {
  importerString: string; // stringified importer (e.g. the file that imports the dynamic module)
  moduleId?: string | null; // optional module id passed by dynamic loader
  knownModules: Record<string, string>; // mapping of known module ids -> path
};

const registry = new Map<string, DynamicModule>();
const orderedRegistry: DynamicModule[] = [];

/**
 * Register a dynamic mock for a specific id (or key).
 */
export const registerDynamicMock = (id: string, module: DynamicModule) => {
  registry.set(id, module);
  orderedRegistry.push(module);
};

/**
 * Register an ordered sequence of dynamic mocks. Useful when multiple dynamics are imported
 * and the test wants to provide them in the import-order.
 */
export const registerDynamicMockSequence = (modules: DynamicModule[]) => {
  orderedRegistry.push(...modules);
};

export const resetDynamicMocks = () => {
  registry.clear();
  orderedRegistry.length = 0;
};

// Auto-reset when running inside Jest to avoid leaking state between tests.
try {
  const g = globalThis as unknown as { afterEach?: (fn: () => void) => void };
  g.afterEach?.(() => resetDynamicMocks());
} catch {
  // noop when not running in Jest
}

/**
 * Resolve a dynamic mock using multiple strategies:
 * 1. If a registered id matches moduleId or knownModules -> return that mock.
 * 2. Otherwise, use the ordered (queue) registry by shifting the next available mock.
 */
export const resolveDynamicMock = ({
  importerString,
  moduleId,
  knownModules,
}: ResolveOptions): DynamicModule | null => {
  const candidateSet = new Set<string>();

  if (moduleId) candidateSet.add(moduleId);

  for (const [key, path] of Object.entries(knownModules)) {
    // Match by key or by path fragment in the importer string
    if (importerString.includes(key) || importerString.includes(path)) {
      candidateSet.add(key);
      candidateSet.add(path);
    }
    if (moduleId && moduleId.includes(key)) {
      candidateSet.add(key);
      candidateSet.add(path);
    }
  }

  for (const candidate of candidateSet) {
    if (!candidate) continue;
    if (registry.has(candidate)) {
      return registry.get(candidate) ?? null;
    }
  }

  // Fall back to sequence queue
  if (orderedRegistry.length > 0) {
    return orderedRegistry.shift() ?? null;
  }

  return null;
};
