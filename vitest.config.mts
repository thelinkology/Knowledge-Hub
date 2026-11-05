import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            // Server modules guard themselves with `import 'server-only'`; tests run them directly.
            'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
        },
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
        // Each database suite boots its own in-memory Postgres (PGlite) — give it time on cold starts.
        testTimeout: 30_000,
        hookTimeout: 60_000,
    },
})
