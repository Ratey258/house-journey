import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70
      }
    }
  }
}); 