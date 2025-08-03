/**
 * Vite性能优化配置
 * 专门针对《买房记》项目的性能优化策略
 */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';
import pkg from './package.json';
import { visualizer } from 'rollup-plugin-visualizer';
import { createHash } from 'crypto';

const resolve = path.resolve;

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  const isAnalyze = process.env.ANALYZE === 'true';

  // 设置环境变量
  process.env.VITE_APP_TITLE = `${pkg.name}v${pkg.version}`;
  process.env.VITE_APP_VERSION = pkg.version;

  return {
    plugins: [
      vue({
        // Vue性能优化
        reactivityTransform: true,
        script: {
          refSugar: true
        }
      }),
      // 打包分析插件
      isAnalyze && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),

    // 定义全局变量
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

    // 开发服务器优化
    server: {
      port: 5174,
      strictPort: false,
      host: '127.0.0.1',
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
        usePolling: false,
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.vscode/**']
      }
    },

    // 🚀 高度优化的构建配置
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      assetsDir: 'assets',
      
      // 性能优化设置
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: !isDevelopment,
          drop_debugger: !isDevelopment,
          pure_funcs: isDevelopment ? [] : ['console.log', 'console.info', 'console.warn']
        },
        format: {
          comments: false
        }
      },
      
      // CSS优化
      cssCodeSplit: true,
      cssMinify: 'lightningcss',
      
      // 依赖预构建优化
      optimizeDeps: {
        include: [
          'vue',
          'vue-router',
          'pinia',
          'vue-i18n'
        ],
        exclude: [
          // 排除大型但不常用的包
          '@vue/devtools-api'
        ]
      },

      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        
        // 外部化大型库（可选）
        external: isDevelopment ? [] : [],
        
        output: {
          // 🎯 智能文件命名策略
          chunkFileNames: (chunkInfo) => {
            // 根据块类型和内容生成有意义的名称
            const facadeModuleId = chunkInfo.facadeModuleId;
            
            if (chunkInfo.name === 'vue-core') {
              return 'assets/vendor/vue-[hash].js';
            }
            if (chunkInfo.name === 'pinia') {
              return 'assets/vendor/pinia-[hash].js';
            }
            if (chunkInfo.name === 'vue-router') {
              return 'assets/vendor/router-[hash].js';
            }
            if (chunkInfo.name === 'vue-i18n') {
              return 'assets/vendor/i18n-[hash].js';
            }
            
            // 业务逻辑代码
            if (chunkInfo.name.includes('business')) {
              return 'assets/business/[name]-[hash].js';
            }
            if (chunkInfo.name.includes('ui-')) {
              return 'assets/ui/[name]-[hash].js';
            }
            if (chunkInfo.name.includes('composables')) {
              return 'assets/composables/[name]-[hash].js';
            }
            if (chunkInfo.name.includes('views')) {
              return 'assets/views/[name]-[hash].js';
            }
            
            return 'assets/chunks/[name]-[hash].js';
          },
          
          entryFileNames: 'assets/entry/[name]-[hash].js',
          
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name?.split('.').pop();
            
            // 图片资源
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return 'assets/images/[name]-[hash].[ext]';
            }
            // 字体资源
            if (/woff2?|eot|ttf|otf/i.test(extType)) {
              return 'assets/fonts/[name]-[hash].[ext]';
            }
            // CSS文件
            if (extType === 'css') {
              return 'assets/css/[name]-[hash].[ext]';
            }
            // 音频文件
            if (/mp3|wav|ogg|m4a/i.test(extType)) {
              return 'assets/audio/[name]-[hash].[ext]';
            }
            
            return 'assets/[ext]/[name]-[hash].[ext]';
          },
          
          // 🔧 极致的代码分割策略
          manualChunks: (id) => {
            // 1. Vue核心生态系统 - 最高优先级缓存
            if (id.includes('node_modules/vue/')) {
              return 'vue-core';
            }
            if (id.includes('node_modules/@vue/')) {
              return 'vue-core';
            }
            
            // 2. 状态管理
            if (id.includes('node_modules/pinia')) {
              return 'pinia';
            }
            
            // 3. 路由
            if (id.includes('node_modules/vue-router')) {
              return 'vue-router';
            }
            
            // 4. 国际化
            if (id.includes('node_modules/vue-i18n')) {
              return 'vue-i18n';
            }
            
            // 5. 工具库 - 按大小和使用频率分组
            if (id.includes('node_modules/lodash')) {
              return 'utils-lodash';
            }
            if (id.includes('node_modules/@vueuse')) {
              return 'utils-vueuse';
            }
            
            // 6. UI库
            if (id.includes('node_modules/element-plus')) {
              return 'ui-framework';
            }
            
            // 7. 图表库
            if (id.includes('node_modules/echarts')) {
              return 'charts';
            }
            
            // 8. 其他第三方库
            if (id.includes('node_modules/')) {
              // 大型库单独分包
              if (id.includes('three.js') || id.includes('babylon.js')) {
                return '3d-engine';
              }
              if (id.includes('axios') || id.includes('fetch')) {
                return 'http-client';
              }
              return 'vendor';
            }
            
            // 9. 应用代码按架构层分割
            
            // Domain层 - 核心业务逻辑
            if (id.includes('/src/core/')) {
              return 'business-core';
            }
            
            // Application层 - 应用服务
            if (id.includes('/src/application/')) {
              return 'business-application';
            }
            
            // Infrastructure层 - 基础设施
            if (id.includes('/src/infrastructure/')) {
              return 'infrastructure';
            }
            
            // UI层按功能模块分割
            if (id.includes('/src/ui/')) {
              // Service Composables - 高频使用
              if (id.includes('/composables/')) {
                return 'composables';
              }
              
              // 视图层 - 按路由懒加载
              if (id.includes('/views/')) {
                return 'views';
              }
              
              // 组件按业务模块分割
              if (id.includes('/components/common/')) {
                return 'ui-common';
              }
              if (id.includes('/components/game/')) {
                return 'ui-game';
              }
              if (id.includes('/components/market/')) {
                return 'ui-market';
              }
              if (id.includes('/components/player/')) {
                return 'ui-player';
              }
              
              // 其他UI代码
              return 'ui-misc';
            }
            
            // 10. 状态管理
            if (id.includes('/src/stores/')) {
              return 'stores';
            }
            
            // 11. 国际化资源
            if (id.includes('/src/i18n/')) {
              return 'i18n';
            }
            
            // 12. 类型定义
            if (id.includes('/src/types/')) {
              return 'types';
            }
            
            // 13. 配置文件
            if (id.includes('/src/config/')) {
              return 'config';
            }
          },
          
          // 压缩和优化选项
          compact: true,
          
          // 全局变量配置
          globals: {
            vue: 'Vue'
          }
        },
        
        // 警告处理
        onwarn(warning, warn) {
          // 忽略某些警告
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
          warn(warning);
        }
      },
      
      // 📊 性能预算和优化目标
      chunkSizeWarningLimit: 600, // 600KB警告阈值
      
      // 报告压缩包大小
      reportCompressedSize: true,
      
      // 写入包信息
      write: true
    },

    // 依赖优化
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'vue-i18n'
      ],
      exclude: [
        '@vue/devtools-api'
      ],
      // 强制预构建
      force: false
    },

    // CSS优化
    css: {
      // 开发模式下保留源映射
      devSourcemap: isDevelopment,
      // CSS模块化
      modules: {
        localsConvention: 'camelCaseOnly'
      }
    },

    // 预览服务器配置
    preview: {
      port: 4173,
      strictPort: false,
      host: '127.0.0.1'
    }
  };
});