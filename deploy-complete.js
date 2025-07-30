const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('======= 开始部署流程 =======');

// 第一步：清理旧的构建文件
console.log('\n🧹 清理旧的构建文件...');
try {
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
    console.log('已清理旧的dist目录');
  }
} catch (error) {
  console.warn('清理时出错:', error.message);
}

// 第二步：构建项目
console.log('\n⚙️ 构建项目...');
execSync('npm run build', { stdio: 'inherit' });
console.log('项目构建完成');

// 第三步：修复Element Plus初始化问题
console.log('\n🔧 修复Element Plus初始化问题...');
try {
  // 读取index.html
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // 添加专门针对Element Plus的修复
  const fixElementPlusScript = `
<script>
  // 在页面加载之前预定义xn函数，避免初始化错误
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

  // 修复其他可能的Element Plus初始化问题
  window.__elementPlus_init = function() {
    // 预加载Element Plus关键依赖
    if (!window.Ln) window.Ln = {};
    if (!window.Nn) window.Nn = {};
    if (!window.On) window.On = {};
    if (!window.Rn) window.Rn = {};
    if (!window.Un) window.Un = {};
    if (!window.Hn) window.Hn = {};
    if (!window.Wn) window.Wn = {};
    if (!window.Kn) window.Kn = {};
    if (!window.qn) window.qn = {};
    if (!window.Yn) window.Yn = {};
    if (!window.Vn) window.Vn = {};
    if (!window.Gn) window.Gn = {};
  };

  // 在DOM加载完成时执行修复
  document.addEventListener('DOMContentLoaded', function() {
    try {
      window.__elementPlus_init();
    } catch (e) {
      console.error('Element Plus初始化修复失败:', e);
    }
  });

  // 加载UI资源前执行预修复
  window.__elementPlus_init();
</script>
`;

  // 将修复脚本添加到<head>标签之前
  indexContent = indexContent.replace('<head>', '<head>' + fixElementPlusScript);

  // 更新文件
  fs.writeFileSync(indexPath, indexContent);
  console.log('Element Plus初始化问题已修复');
} catch (error) {
  console.error('修复Element Plus时出错:', error);
}

// 第四步：应用通用修复
console.log('\n🔨 应用通用修复...');
try {
  // 读取index.html
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // 确保所有资源路径使用相对路径
  indexContent = indexContent.replace(/src="\//g, 'src="./');
  indexContent = indexContent.replace(/href="\//g, 'href="./');
  indexContent = indexContent.replace(/content="\//g, 'content="./');

  // 添加通用错误处理和加载状态管理
  const debugScript = `
<script>
  // 全局配置
  window.__APP_CONFIG__ = {
    isGitHubPages: true,
    baseUrl: window.location.pathname.replace(/\\/[^/]*$/, '/'),
    debug: true,
    retryCount: 0,
    maxRetries: 3
  };

  // 全局错误处理器
  window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error || e.message);
    if (e.error && e.error.stack) {
      console.error('错误堆栈:', e.error.stack);
    }

    // 显示友好的错误消息
    setTimeout(function() {
      const appElement = document.getElementById('app');
      if (appElement && (!appElement.children.length || appElement.innerHTML.trim() === '')) {
        appElement.innerHTML = \`
          <div style="text-align:center;padding:20px;font-family:Arial,sans-serif;">
            <h2 style="color:#e74c3c;">加载出错</h2>
            <p>应用加载过程中遇到问题</p>
            <div style="margin:15px;padding:10px;background:#f8f9fa;border-radius:4px;text-align:left;">
              <strong>错误信息:</strong> \${e.message || '未知错误'}<br>
            </div>
            <button onclick="window.location.reload()" style="padding:8px 16px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;">
              刷新页面
            </button>
            <button onclick="localStorage.clear();sessionStorage.clear();window.location.reload()" style="margin-left:10px;padding:8px 16px;background:#e67e22;color:white;border:none;border-radius:4px;cursor:pointer;">
              清除缓存并刷新
            </button>
          </div>
        \`;
      }
    }, 500);
  });

  // 10秒后检查加载状态
  setTimeout(function() {
    const appElement = document.getElementById('app');
    if (appElement && (!appElement.children.length || appElement.innerHTML.trim() === '')) {
      appElement.innerHTML = \`
        <div style="text-align:center;padding:20px;font-family:Arial,sans-serif;">
          <h2 style="color:#e74c3c;">加载超时</h2>
          <p>应用加载时间过长</p>
          <button onclick="window.location.reload()" style="padding:8px 16px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;">
            刷新页面
          </button>
          <button onclick="localStorage.clear();sessionStorage.clear();window.location.reload()" style="margin-left:10px;padding:8px 16px;background:#e67e22;color:white;border:none;border-radius:4px;cursor:pointer;">
            清除缓存并刷新
          </button>
        </div>
      \`;
    }
  }, 15000);
</script>
`;

  // 将调试脚本添加到</head>之前
  indexContent = indexContent.replace('</head>', debugScript + '</head>');

  // 写回文件
  fs.writeFileSync(indexPath, indexContent);

  // 创建404.html
  const notFoundPath = path.join(__dirname, 'dist', '404.html');
  fs.writeFileSync(notFoundPath, indexContent);

  // 创建.nojekyll文件
  fs.writeFileSync(path.join(__dirname, 'dist', '.nojekyll'), '');

  console.log('通用修复已应用');
} catch (error) {
  console.error('应用通用修复时出错:', error);
}

// 第五步：备份文件（可选）
console.log('\n💾 备份原始文件...');
try {
  const backupDir = path.join(__dirname, 'dist-backup-' + Date.now());
  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(
    path.join(__dirname, 'dist', 'index.html'),
    path.join(backupDir, 'index.html')
  );
  console.log(`文件已备份到 ${backupDir}`);
} catch (error) {
  console.warn('备份时出错:', error.message);
}

// 第六步：部署到GitHub Pages
console.log('\n🚀 部署到GitHub Pages...');
try {
  execSync('npx gh-pages -d dist', { stdio: 'inherit' });
  console.log('已成功部署到GitHub Pages');
} catch (error) {
  console.error('部署失败:', error);
  process.exit(1);
}

console.log('\n✅ 部署流程已完成!');
console.log('🌐 网站地址: https://ratey258.github.io/house-journey/');
console.log('⚠️ 提示: 如果网站仍然有问题，请尝试清除浏览器缓存后刷新页面');
