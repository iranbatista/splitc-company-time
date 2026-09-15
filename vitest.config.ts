import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Config separada de propósito: o vite.config.ts carrega env do Notion e
// valida API_BASE, coisas que não têm nada a ver com rodar teste de módulo
// puro. Quando existe vitest.config.ts, o Vitest ignora o vite.config.ts.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
