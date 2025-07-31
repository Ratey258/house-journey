import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';

// 使用path.resolve替代直接引入的resolve
const resolve = path.resolve;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    base: './',
    server: {
      port: 5173,
      strictPort: false,
      host: '127.0.0.1',
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 5173
      },
      watch: {
        usePolling: true
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        },
        output: {
          manualChunks: {
            'vendor': [
              'vue',
              'vue-router',
              'pinia',
              'vue-i18n'
            ],
            'ui': ['element-plus'],
            'chart': ['chart.js', 'echarts'],
            'utilities': ['lodash-es', 'dayjs', '@vueuse/core']
          }
        }
      },
      sourcemap: isDevelopment,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: !isDevelopment,
          drop_debugger: !isDevelopment
        }
      },
      // 指定目标浏览器范围，确保兼容性
      target: ['chrome92', 'safari14', 'edge88', 'firefox90']
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'element-plus', 'lodash-es']
    },
    esbuild: {
      drop: !isDevelopment ? ['console', 'debugger'] : []
    }
  };
});
