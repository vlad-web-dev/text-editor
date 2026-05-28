import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  css: {
    // Skip CSS processing in tests — we're testing logic, not styles
    modules: { classNameStrategy: 'non-scoped' },
  },
})
