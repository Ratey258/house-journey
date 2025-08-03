import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';
import pkg from './package.json';
import { createHash } from 'crypto';

// 使用path.resolve替代直接引入的resolve
const resolve = path.resolve;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  // 设置环境变量供HTML模板使用
  process.env.VITE_APP_TITLE = `${pkg.name}v${pkg.version}`;
  process.env.VITE_APP_VERSION = pkg.version;

  return {
    plugins: [vue()],
    // 定义全局变量，自动注入版本号
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __APP_NAME__: JSON.stringify(pkg.name),
      __APP_DESCRIPTION__: JSON.stringify(pkg.description),
      __APP_AUTHOR__: JSON.stringify(pkg.author),
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    base: './',
    server: {
      port: 5174,
      strictPort: false,
      host: '127.0.0.1',
      // 改进的HMR配置，避免连接问题
      hmr: {
        protocol: 'ws',
        host: '127.0.0.1',
        port: 5174,
        overlay: {
          warnings: false,
          errors: true
        }
      },
      watch: {
        usePolling: false, // 禁用轮询以提高性能
        // 优化文件监听
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.vscode/**']
      },
      // 开发体验优化
      open: false,
      cors: true,
      // 预加载模块以提升性能
      warmup: {
        clientFiles: [
          './src/app/main.ts',
          './src/App.vue',
          './src/stores/index.ts'
        ]
      },
      // 添加错误处理
      middlewareMode: false,
      fs: {
        strict: false
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
          // Vite 7 优化的代码分割策略
          manualChunks: (id) => {
            // 核心框架单独打包
            if (id.includes('vue') && !id.includes('node_modules/vue-')) {
              return 'vue-core';
            }
            // Vue生态系统
            if (id.includes('vue-router') || id.includes('pinia') || id.includes('vue-i18n')) {
              return 'vue-ecosystem';
            }
            // UI库
            if (id.includes('element-plus')) {
              return 'ui-framework';
            }
            // 图表库（大型依赖）
                    if (id.includes('echarts')) {
          return 'charts';
        }
            // 工具库
            if (id.includes('lodash-es') || id.includes('dayjs') || id.includes('@vueuse/core')) {
              return 'utilities';
            }
            // 游戏核心逻辑
            if (id.includes('/src/core/') || id.includes('/src/stores/')) {
              return 'game-core';
            }
            // UI组件
            if (id.includes('/src/ui/')) {
              return 'game-ui';
            }
            // 其他第三方库
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          // Vite 7 改进的文件命名
          chunkFileNames: (chunkInfo) => {
            return `assets/[name]-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            // 分类资源文件，优化缓存策略
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/css/[name]-[hash][extname]';
            }
            if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(assetInfo.name || '')) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name || '')) {
              return 'assets/media/[name]-[hash][extname]';
            }
            return 'assets/misc/[name]-[hash][extname]';
          }
        }
      },
      sourcemap: isDevelopment,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: !isDevelopment,
          drop_debugger: !isDevelopment,
          // 额外的压缩优化
          pure_funcs: !isDevelopment ? ['console.log', 'console.info'] : [],
          passes: 2, // 多次压缩以获得更好的结果
        },
        mangle: {
          properties: {
            regex: /^_[a-zA-Z]/  // 私有属性压缩
          }
        }
      },
      // 使用Vite 7推荐的现代浏览器目标（Baseline Widely Available）
      target: ['chrome107', 'safari16', 'edge107', 'firefox104'],
      // 资源大小限制和优化
      chunkSizeWarningLimit: 1000, // 1MB chunk警告阈值
      assetsInlineLimit: 4096, // 4KB以下内联为base64
      // 实验性特性：CSS代码分割
      cssCodeSplit: true,
      // 启用现代化构建特性
      reportCompressedSize: false // 禁用gzip大小报告以提升构建速度
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'element-plus', 'lodash-es'],
      // Vite 7 优化：更好的依赖预构建
      holdUntilCrawlEnd: false, // 改善大型项目的冷启动性能
      force: false // 避免不必要的重新构建
    },
    esbuild: {
      drop: !isDevelopment ? ['console', 'debugger'] : [],
      // Vite 7 优化：更好的代码优化
      legalComments: 'none', // 移除法律注释以减小体积
      minifyIdentifiers: !isDevelopment,
      minifySyntax: !isDevelopment,
      minifyWhitespace: !isDevelopment
    },
    // Vite 7 新特性：JSON处理优化
    json: {
      stringify: 'auto', // 自动决定是否字符串化大型JSON
      namedExports: true   // 支持命名导出
    },
    // CSS处理优化
    css: {
      devSourcemap: isDevelopment,
      // CSS代码分割
      codeSplit: true,
      // CSS模块配置
      modules: {
        localsConvention: 'camelCase'
      }
    }
  };
});
