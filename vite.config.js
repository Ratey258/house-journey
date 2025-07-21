import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: './', // 使用相对路径
  server: {
    port: 5174, // 修改端口为5174
    strictPort: false, // 如果端口被占用则尝试下一个可用端口
    host: '127.0.0.1', // 明确指定host
    hmr: {
      protocol: 'ws', // 使用websocket
      host: 'localhost',
      port: 5174 // 修改HMR端口
    },
    watch: {
      usePolling: true // 在某些系统上可能需要
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html') // 修改入口文件路径
      },
      output: {
        manualChunks: (id) => {
          // 将所有store文件放在同一个chunk中，避免循环依赖
          if (id.includes('/stores/')) {
            return 'stores';
          }
          // 基础库
          if (id.includes('node_modules/vue/') || 
              id.includes('node_modules/pinia/') || 
              id.includes('node_modules/vue-router/') || 
              id.includes('node_modules/vue-i18n/')) {
            return 'vendor';
          }
          // UI库
          if (id.includes('node_modules/element-plus/')) {
            return 'ui';
          }
        }
      }
    },
    sourcemap: true, // 开发环境启用sourcemap
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 开发环境保留console
        drop_debugger: false // 开发环境保留debugger
      }
    }
  }
}); 