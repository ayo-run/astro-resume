import { getViteConfig } from 'astro/config'

/**
 * `getViteConfig` gives the test run Astro's own Vite setup, which is what
 * makes `.astro` files importable from a test (needed by the Container API
 * tests for `Serialize.astro`).
 */
export default getViteConfig(
  {
    test: {
      include: ['test/**/*.test.ts'],
      // `deserialize` is pure DOM, so its suite opts into happy-dom with a
      // `@vitest-environment` docblock. Everything else runs in plain node.
      environment: 'node'
    }
  },
  // This directory is a component package, not an Astro site, so quiet the
  // "missing pages directory" notice Astro logs while booting.
  {
    logLevel: 'error'
  }
)
