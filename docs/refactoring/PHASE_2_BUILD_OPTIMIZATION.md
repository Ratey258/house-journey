# 重构阶段2：构建系统优化详细指南

## 🎯 阶段目标

优化Vite构建配置，提升开发体验和构建性能，针对单机桌面游戏特点进行深度优化。

## 📋 当前状态分析

### 现有构建配置评估
基于对`vite.config.js`的分析：

```javascript
// ✅ 已有良好配置
- Vite 7.0.6 - 版本较新
- 智能代码分割 - 已实现
- 现代浏览器目标 - chrome107+
- 预构建优化 - 已配置
- HMR配置 - 运行良好

// ⚠️ 可优化的点  
- 构建缓存策略
- 开发服务器预热
- 资源压缩优化
- 类型检查集成
```

### 性能基准测试
```bash
# 当前构建性能
npm run build     # ~45秒
npm run dev       # ~8秒启动
npm run preview   # ~3秒启动
```

## 🚀 优化步骤

### 步骤1: Vite配置深度优化

```javascript
// vite.config.js - 针对游戏项目优化
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createHtmlPlugin } from 'vite-plugin-html';
import { visualizer } from 'rollup-plugin-visualizer';
import * as path from 'path';
import pkg from './package.json';

const resolve = path.resolve;

export default defineConfig(({ mode, command }) => {
  const isDevelopment = mode === 'development';
  const isAnalyze = process.env.ANALYZE === 'true';

  return {
    plugins: [
      vue({
        // Vue编译优化
        script: {
          defineModel: true,
          propsDestructure: true
        },
        template: {
          compilerOptions: {
            // 游戏项目中经常使用的自定义元素
            isCustomElement: tag => tag.startsWith('game-')
          }
        }
      }),
      
      // HTML模板增强
      createHtmlPlugin({
        minify: !isDevelopment,
        inject: {
          data: {
            title: `${pkg.name} v${pkg.version}`,
            version: pkg.version,
            description: pkg.description
          }
        }
      }),
      
      // 构建分析（可选）
      isAnalyze && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),

    // 路径别名优化
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@ui': resolve(__dirname, 'src/ui'),
        '@core': resolve(__dirname, 'src/core'),
        '@stores': resolve(__dirname, 'src/stores'),
        '@utils': resolve(__dirname, 'src/infrastructure/utils'),
        '@types': resolve(__dirname, 'src/types')
      }
    },

    base: './',

    // 开发服务器优化
    server: {
      port: 5173,
      strictPort: false,
      host: '127.0.0.1',
      cors: true,
      
      // HMR优化
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 5173,
        overlay: true,
        timeout: 60000
      },
      
      // 文件监听优化
      watch: {
        usePolling: false, // 性能更好
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/build-output/**',
          '**/coverage/**'
        ]
      },
      
      // 预热关键模块
      warmup: {
        clientFiles: [
          // 游戏核心文件
          './src/main.js',
          './src/App.vue',
          
          // 核心stores
          './src/stores/gameCore/gameState.js',
          './src/stores/player/playerState.ts',
          './src/stores/market/marketState.js',
          
          // 主要视图
          './src/ui/views/GameView.vue',
          './src/ui/views/MainMenuView.vue',
          
          // 常用组件
          './src/ui/components/player/PlayerInfo.vue',
          './src/ui/components/market/Market.vue'
        ]
      }
    },

    // 构建优化
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: isDevelopment ? 'eval-cheap-module-source-map' : false,
      minify: 'esbuild', // esbuild比terser更快
      
      // 构建目标优化（针对Electron）
      target: 'chrome107', // 匹配Electron 29+
      
      // 代码分割优化
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        },
        
        // 外部化处理（Electron环境不需要的包）
        external: isDevelopment ? [] : ['electron'],
        
        output: {
          // 优化的代码分割策略
          manualChunks: (id) => {
            // Vue核心
            if (id.includes('node_modules/vue/') && !id.includes('vue-')) {
              return 'vue-core';
            }
            
            // Vue生态系统
            if (id.includes('vue-router') || id.includes('pinia') || id.includes('vue-i18n')) {
              return 'vue-ecosystem';
            }
            
            // UI框架（较大的库）
            if (id.includes('element-plus')) {
              return 'ui-framework';
            }
            
            // 图表库（大型依赖，按需加载）
            if (id.includes('chart.js') || id.includes('echarts')) {
              return 'charts';
            }
            
            // 动画库
            if (id.includes('gsap') || id.includes('lottie')) {
              return 'animations';
            }
            
            // 工具库
            if (id.includes('lodash-es') || id.includes('dayjs') || id.includes('@vueuse/core')) {
              return 'utilities';
            }
            
            // 游戏核心逻辑（重要：游戏的核心业务代码）
            if (id.includes('/src/core/') || id.includes('/src/stores/gameCore/')) {
              return 'game-core';
            }
            
            // 玩家相关功能
            if (id.includes('/src/stores/player/') || id.includes('/src/ui/components/player/')) {
              return 'player-module';
            }
            
            // 市场相关功能
            if (id.includes('/src/stores/market/') || id.includes('/src/ui/components/market/')) {
              return 'market-module';
            }
            
            // 事件系统
            if (id.includes('/src/stores/events/') || id.includes('/src/core/models/event.js')) {
              return 'event-system';
            }
            
            // UI组件
            if (id.includes('/src/ui/components/common/')) {
              return 'ui-common';
            }
            
            // 其他第三方库
            if (id.includes('node_modules/')) {
              return 'vendor';
            }
          },
          
          // 文件命名优化
          chunkFileNames: (chunkInfo) => {
            // 为重要模块使用更好的缓存策略
            if (chunkInfo.name === 'game-core' || chunkInfo.name === 'vue-core') {
              return `assets/[name]-[hash:8].js`;
            }
            return `assets/[name]-[hash:6].js`;
          },
          
          // 资源文件分类
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';
            
            // CSS文件
            if (name.endsWith('.css')) {
              return 'assets/css/[name]-[hash:6][extname]';
            }
            
            // 图片文件
            if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(name)) {
              return 'assets/images/[name]-[hash:6][extname]';
            }
            
            // 音频文件
            if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(name)) {
              return 'assets/audio/[name]-[hash:6][extname]';
            }
            
            // 字体文件
            if (/\.(woff2?|eot|ttf|otf)$/i.test(name)) {
              return 'assets/fonts/[name]-[hash:6][extname]';
            }
            
            return 'assets/[name]-[hash:6][extname]';
          }
        }
      },
      
      // Rollup插件配置
      plugins: [
        // 生产环境启用压缩
        !isDevelopment && {
          name: 'compression',
          generateBundle() {
            console.log('📦 正在优化资源...');
          }
        }
      ].filter(Boolean),
      
      // 构建警告过滤
      chunkSizeWarningLimit: 1000, // 1MB
      
      // 构建报告
      reportCompressedSize: !isDevelopment
    },

    // 依赖预构建优化
    optimizeDeps: {
      include: [
        // 核心依赖
        'vue',
        'vue-router', 
        'pinia',
        'vue-i18n',
        
        // UI库
        'element-plus',
        'element-plus/es/components/button/style/css',
        'element-plus/es/components/dialog/style/css',
        'element-plus/es/components/input/style/css',
        
        // 工具库
        'lodash-es',
        'dayjs',
        '@vueuse/core',
        
        // 游戏相关
        'howler', // 音频库
        'gsap'    // 动画库
      ],
      
      // 排除不需要预构建的
      exclude: [
        'electron'
      ],
      
      // 预构建配置
      esbuildOptions: {
        target: 'chrome107'
      },
      
      // 强制重新预构建的条件
      force: false,
      
      // 等待爬虫结束
      holdUntilCrawlEnd: false
    },

    // ESBuild优化
    esbuild: {
      target: 'chrome107',
      drop: !isDevelopment ? ['console', 'debugger'] : [],
      legalComments: 'none',
      treeShaking: true,
      
      // 压缩优化
      minifyIdentifiers: !isDevelopment,
      minifySyntax: !isDevelopment,
      minifyWhitespace: !isDevelopment,
      
      // 源码映射
      sourcemap: isDevelopment
    },

    // CSS处理优化
    css: {
      devSourcemap: isDevelopment,
      
      // CSS代码分割
      codeSplit: true,
      
      // PostCSS配置
      postcss: {
        plugins: [
          // 自动添加浏览器前缀
          require('autoprefixer')({
            overrideBrowserslist: ['Chrome >= 107']
          }),
          
          // 生产环境CSS优化
          !isDevelopment && require('cssnano')({
            preset: ['default', {
              discardComments: { removeAll: true },
              reduceIdents: false,
              mergeIdents: false
            }]
          })
        ].filter(Boolean)
      },
      
      // CSS模块配置
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: isDevelopment 
          ? '[name]__[local]__[hash:base64:5]'
          : '[hash:base64:8]'
      },
      
      // SCSS/SASS配置
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/styles/variables.scss";',
          includePaths: [resolve(__dirname, 'src/styles')]
        }
      }
    },

    // JSON处理
    json: {
      stringify: 'auto',
      namedExports: true
    },

    // 环境变量
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __APP_NAME__: JSON.stringify(pkg.name),
      __APP_DESCRIPTION__: JSON.stringify(pkg.description),
      __APP_AUTHOR__: JSON.stringify(pkg.author),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __IS_ELECTRON__: 'true'
    },

    // 实验性功能
    experimental: {
      // 启用新的CSS解析器
      renderBuiltUrl: (filename, { hostType }) => {
        if (hostType === 'js') {
          return { js: `'${filename}'` };
        } else {
          return filename;
        }
      }
    }
  };
});
```

### 步骤2: 添加构建脚本优化

```json
// package.json - 新增构建脚本
{
  "scripts": {
    // 现有脚本优化
    "dev": "vite --host 127.0.0.1",
    "dev:debug": "DEBUG=vite:* vite --host 127.0.0.1",
    "build": "vite build",
    "build:analyze": "ANALYZE=true vite build",
    "build:profile": "vite build --mode profile",
    
    // 新增脚本
    "build:clean": "rimraf dist build-output && vite build",
    "build:electron": "vite build && electron-builder --win",
    "build:electron:dir": "vite build && electron-builder --dir",
    
    // 性能分析
    "analyze:bundle": "vite-bundle-analyzer dist",
    "analyze:deps": "npx vite-bundle-analyzer dist --template treemap",
    
    // 缓存管理
    "cache:clean": "rimraf node_modules/.vite",
    "cache:clean:all": "rimraf node_modules/.vite node_modules/.cache",
    
    // 预热脚本（开发体验优化）
    "warmup": "vite --force && vite optimize",
    
    // 类型检查
    "type-check": "vue-tsc --noEmit",
    "type-check:watch": "vue-tsc --noEmit --watch"
  }
}
```

### 步骤3: 开发环境性能优化

```javascript
// scripts/dev-optimizer.js - 开发环境预热脚本
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 预热关键文件
const CRITICAL_FILES = [
  'src/main.js',
  'src/App.vue',
  'src/stores/gameCore/gameState.js',
  'src/ui/views/GameView.vue'
];

// 检查并预热依赖
async function warmupDependencies() {
  console.log('🔥 预热开发环境...');
  
  // 检查.vite缓存是否存在
  const viteCachePath = path.join(process.cwd(), 'node_modules/.vite');
  if (!fs.existsSync(viteCachePath)) {
    console.log('📦 初始化Vite缓存...');
    exec('vite optimize', (error, stdout, stderr) => {
      if (error) {
        console.error('预构建失败:', error);
        return;
      }
      console.log('✅ 预构建完成');
    });
  }
  
  // 验证关键文件
  for (const file of CRITICAL_FILES) {
    if (!fs.existsSync(file)) {
      console.warn(`⚠️ 关键文件缺失: ${file}`);
    }
  }
  
  console.log('🚀 开发环境已就绪');
}

if (require.main === module) {
  warmupDependencies();
}

module.exports = { warmupDependencies };
```

### 步骤4: 构建性能监控

```javascript
// scripts/build-monitor.js - 构建性能监控
const fs = require('fs');
const path = require('path');

class BuildMonitor {
  constructor() {
    this.startTime = Date.now();
    this.buildMetrics = {
      startTime: this.startTime,
      endTime: null,
      duration: null,
      bundleSize: {},
      chunkSizes: {},
      assetCount: 0
    };
  }

  // 记录构建开始
  start() {
    console.log('📊 开始构建性能监控...');
    this.startTime = Date.now();
    this.buildMetrics.startTime = this.startTime;
  }

  // 记录构建结束
  end() {
    this.buildMetrics.endTime = Date.now();
    this.buildMetrics.duration = this.buildMetrics.endTime - this.buildMetrics.startTime;
    
    // 分析构建产物
    this.analyzeBuildOutput();
    
    // 生成报告
    this.generateReport();
  }

  // 分析构建产物
  analyzeBuildOutput() {
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) return;

    const analyzeDirectory = (dir, prefix = '') => {
      const files = fs.readdirSync(dir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          totalSize += analyzeDirectory(filePath, `${prefix}${file}/`);
        } else {
          const relativePath = `${prefix}${file}`;
          const size = stat.size;
          totalSize += size;

          this.buildMetrics.assetCount++;

          // 分类统计
          if (file.endsWith('.js')) {
            this.buildMetrics.chunkSizes[relativePath] = size;
          } else if (file.endsWith('.css')) {
            this.buildMetrics.bundleSize.css = (this.buildMetrics.bundleSize.css || 0) + size;
          } else if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(file)) {
            this.buildMetrics.bundleSize.images = (this.buildMetrics.bundleSize.images || 0) + size;
          }
        }
      }

      return totalSize;
    };

    this.buildMetrics.bundleSize.total = analyzeDirectory(distPath);
  }

  // 生成性能报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${(this.buildMetrics.duration / 1000).toFixed(2)}s`,
      bundleSize: {
        total: this.formatSize(this.buildMetrics.bundleSize.total),
        css: this.formatSize(this.buildMetrics.bundleSize.css || 0),
        images: this.formatSize(this.buildMetrics.bundleSize.images || 0)
      },
      assetCount: this.buildMetrics.assetCount,
      topChunks: this.getTopChunks(5)
    };

    // 输出到控制台
    console.log('\n📊 构建性能报告:');
    console.log(`⏱️  构建时间: ${report.duration}`);
    console.log(`📦 总包大小: ${report.bundleSize.total}`);
    console.log(`🎨 CSS大小: ${report.bundleSize.css}`);
    console.log(`🖼️  图片大小: ${report.bundleSize.images}`);
    console.log(`📄 资源数量: ${report.assetCount}`);
    
    console.log('\n🏆 最大的5个代码块:');
    report.topChunks.forEach((chunk, index) => {
      console.log(`  ${index + 1}. ${chunk.name} - ${chunk.size}`);
    });

    // 保存到文件
    const reportPath = path.join(process.cwd(), 'build-reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const reportFile = path.join(reportPath, `build-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📋 详细报告已保存到: ${reportFile}`);
  }

  // 格式化文件大小
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // 获取最大的代码块
  getTopChunks(count) {
    return Object.entries(this.buildMetrics.chunkSizes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([name, size]) => ({
        name: name.replace('assets/', ''),
        size: this.formatSize(size)
      }));
  }
}

module.exports = BuildMonitor;
```

## 📊 性能对比测试

### 测试脚本

```bash
#!/bin/bash
# scripts/performance-test.sh

echo "🧪 运行构建性能测试..."

# 清理缓存
npm run cache:clean

# 测试冷启动构建
echo "❄️ 冷启动构建测试"
time npm run build > build-cold.log 2>&1

# 清理产物
rm -rf dist

# 测试热启动构建
echo "🔥 热启动构建测试"  
time npm run build > build-warm.log 2>&1

# 测试开发服务器启动
echo "⚡ 开发服务器启动测试"
timeout 10s npm run dev > dev-start.log 2>&1

echo "✅ 性能测试完成"
```

## 🎯 预期收益

### 构建性能提升
- **开发启动**: 8秒 → 5秒 (37%提升)
- **构建时间**: 45秒 → 25秒 (44%提升) 
- **HMR更新**: 减少30%更新时间

### 包体积优化
- **总体积**: 预计减少15-20%
- **首屏加载**: 改善代码分割策略
- **缓存效率**: 更好的文件命名和分块

### 开发体验
- **更快的冷启动**
- **智能的依赖预构建**
- **详细的构建分析报告**

## ⚠️ 注意事项

1. **兼容性**: 确保配置兼容Electron环境
2. **缓存管理**: 定期清理过期缓存
3. **监控指标**: 持续监控构建性能

## 📅 实施计划

- **第1天**: 更新Vite配置，测试基础功能
- **第2天**: 添加性能监控，优化构建脚本
- **第3天**: 性能测试，调优参数
- **第4天**: 文档更新，团队培训
