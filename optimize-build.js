const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('开始优化构建过程...');

// 第一步：创建临时的Vite配置文件
const tempViteConfigPath = path.join(__dirname, 'vite.config.optimize.js');
const viteConfigContent = `
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
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    minify: 'esbuild', // 使用更快的minifier
    sourcemap: false, // 禁用sourcemap，减小文件体积
    cssCodeSplit: true,
    // 确保静态资源被正确复制
    copyPublicDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: (id) => {
          // 独立Element Plus
          if (id.includes('node_modules/element-plus/') || id.includes('node_modules/@element-plus/')) {
            return 'element-plus';
          }

          // 将所有store文件放在同一个chunk中，避免循环依赖
          if (id.includes('/stores/')) {
            return 'stores';
          }

          // Vue相关库
          if (id.includes('node_modules/vue/') ||
              id.includes('node_modules/pinia/') ||
              id.includes('node_modules/vue-router/') ||
              id.includes('node_modules/vue-i18n/')) {
            return 'vue-core';
          }

          // 其他依赖库
          if (id.includes('node_modules/') && !id.includes('.css')) {
            return 'vendor';
          }
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: false, // 保留console以便调试
        drop_debugger: false,
        pure_funcs: [] // 不清除任何函数
      },
      format: {
        comments: false // 移除注释
      },
      // 避免改变函数名以防止xn错误
      mangle: {
        keep_fnames: true,
        reserved: ['xn']
      }
    }
  }
});
`;

fs.writeFileSync(tempViteConfigPath, viteConfigContent);
console.log('创建了优化的Vite配置');

// 第二步：使用优化的配置进行构建
console.log('\n开始使用优化配置构建项目...');
try {
  execSync(`npx vite build --config ${tempViteConfigPath}`, { stdio: 'inherit' });
  console.log('项目构建完成');
} catch (error) {
  console.error('构建失败:', error);
  process.exit(1);
}

// 第三步：添加额外的脚本到index.html
console.log('\n添加预加载脚本...');
try {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // 添加预加载脚本
  const preloadScript = `
<script>
  // 预定义xn函数和其他Element Plus函数
  window.xn = function(e, t) {
    return function(...l) {
      return new Promise((n, a) => {
        Promise.resolve(e(() => t.apply(this, l), {
          fn: t,
          thisArg: this,
          args: l
        })).then(n).catch(a);
      });
    };
  };

  // 错误处理和加载状态
  window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error || e.message);
    const appElement = document.getElementById('app');
    if (appElement && (!appElement.children.length || appElement.innerHTML.trim() === '')) {
      appElement.innerHTML = '<div style="text-align:center;padding:20px;"><h2>加载出错</h2><p>请尝试刷新页面</p><p>' +
        e.message + '</p><button onclick="localStorage.clear();window.location.reload()">清除缓存并刷新</button></div>';
    }
  });

  // 10秒后检查加载状态
  setTimeout(function() {
    const appElement = document.getElementById('app');
    if (appElement && (!appElement.children.length || appElement.innerHTML.trim() === '')) {
      appElement.innerHTML = '<div style="text-align:center;padding:20px;"><h2>加载超时</h2><p>请尝试刷新页面</p>' +
        '<button onclick="localStorage.clear();window.location.reload()">清除缓存并刷新</button></div>';
    }
  }, 15000);
</script>
  `;

  // 将脚本添加到<head>之前
  indexContent = indexContent.replace('<head>', '<head>' + preloadScript);

  // 写回文件
  fs.writeFileSync(indexPath, indexContent);

  // 创建404.html
  const notFoundPath = path.join(__dirname, 'dist', '404.html');
  fs.writeFileSync(notFoundPath, indexContent);

  // 创建.nojekyll文件
  fs.writeFileSync(path.join(__dirname, 'dist', '.nojekyll'), '');

  console.log('脚本添加完成');
} catch (error) {
  console.error('添加脚本失败:', error);
}

// 第四步：复制资源文件
console.log('\n确保资源文件被正确复制...');
try {
  // 确保目标目录存在
  const resourcesDir = path.join(__dirname, 'dist', 'resources');
  if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
  }

  // 复制resources目录
  const sourceResourcesDir = path.join(__dirname, 'resources');
  if (fs.existsSync(sourceResourcesDir)) {
    copyFolderRecursiveSync(sourceResourcesDir, path.join(__dirname, 'dist'));
    console.log('资源文件复制完成');
  } else {
    console.warn('源资源目录不存在:', sourceResourcesDir);
  }
} catch (error) {
  console.error('复制资源文件失败:', error);
}

// 第五步：部署
console.log('\n开始部署到GitHub Pages...');
try {
  execSync('npx gh-pages -d dist', { stdio: 'inherit' });
  console.log('部署完成');
} catch (error) {
  console.error('部署失败:', error);
  process.exit(1);
}

// 递归复制文件夹的辅助函数
function copyFolderRecursiveSync(source, targetBase) {
  const target = path.join(targetBase, path.basename(source));

  // 创建目标文件夹
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // 复制文件夹内容
  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach(file => {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, target);
      } else {
        fs.copyFileSync(curSource, path.join(target, file));
      }
    });
  }
}

// 第六步：清理临时文件
try {
  fs.unlinkSync(tempViteConfigPath);
  console.log('清理了临时文件');
} catch (error) {
  console.warn('清理临时文件失败:', error.message);
}

console.log('\n全部完成!');
console.log('网站地址: https://ratey258.github.io/house-journey/');
