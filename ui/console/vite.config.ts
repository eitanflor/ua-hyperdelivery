import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  test: {
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      // Logic only: components and routes have no tests yet, so counting them would hide it.
      include: ['src/lib/**', 'src/store/**', 'src/api/**'],
      exclude: ['**/*.test.ts'],
      reporter: ['text', 'html'],
      // A ratchet, not a target: raise it as tests are added, never lower it.
      thresholds: { statements: 70 },
    },
  },
})
