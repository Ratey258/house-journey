const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ghpages = require('gh-pages');

// 第一步：构建项目
console.log('开始构建项目...');
execSync('npm run build', { stdio: 'inherit' });
console.log('项目构建完成');

// 第二步：优化构建文件
console.log('开始优化构建文件...');

// 读取dist/index.html文件
const indexPath = path.join(__dirname, 'dist', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// 确保所有资源路径使用相对路径
indexContent = indexContent.replace(/src="\//g, 'src="./');
indexContent = indexContent.replace(/href="\//g, 'href="./');

// 添加基本的错误处理和加载状态管理
const enhancementScript = `
<script>
  // 错误处理
  window.addEventListener('error', function(e) {
    console.error('全局错误捕获:', e.error || e.message);
    const appElement = document.getElementById('app');
    if (appElement && (!appElement.children.length || appElement.children.length === 0)) {
      appElement.innerHTML = '<div style="text-align:center;padding:20px;"><h2>加载出错</h2><p>请尝试刷新页面或清除浏览器缓存</p><p>错误信息: ' + (e.message || '未知错误') + '</p></div>';
    }
  });

  // 处理模块加载失败
  window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise拒绝:', e.reason);
    const appElement = document.getElementById('app');
    if (appElement && (!appElement.children.length || appElement.children.length === 0)) {
      appElement.innerHTML = '<div style="text-align:center;padding:20px;"><h2>模块加载失败</h2><p>请尝试刷新页面或清除浏览器缓存</p><p>错误信息: ' + (e.reason ? (e.reason.message || '未知错误') : '未知错误') + '</p></div>';
    }
  });

  // 在10秒后检查加载状态
  setTimeout(function() {
    const appElement = document.getElementById('app');
    if (appElement && (!appElement.children.length || appElement.children.length === 0)) {
      appElement.innerHTML = '<div style="text-align:center;padding:20px;"><h2>加载超时</h2><p>请尝试刷新页面或清除浏览器缓存</p></div>';
    }
  }, 10000);

  // 确保Vue路由在hash模式下正确工作
  if (window.location.pathname !== '/' && !window.location.pathname.endsWith('/index.html')) {
    window.location.href = window.location.origin + window.location.pathname.replace(/\\/[^/]*$/, '/') + '#' + window.location.pathname.replace(/.*\\/([^/]*)$/, '$1');
  }
</script>
`;

// 将增强脚本添加到HTML的头部
indexContent = indexContent.replace('</head>', enhancementScript + '</head>');

// 写回index.html
fs.writeFileSync(indexPath, indexContent);

// 创建404.html用于SPA路由
console.log('创建404.html页面...');
const notFoundPath = path.join(__dirname, 'dist', '404.html');
fs.writeFileSync(notFoundPath, indexContent);

// 创建.nojekyll文件（避免GitHub Pages默认使用Jekyll处理）
fs.writeFileSync(path.join(__dirname, 'dist', '.nojekyll'), '');

console.log('优化完成');

// 第三步：部署到GitHub Pages
console.log('开始部署到GitHub Pages...');
ghpages.publish('dist', {
  message: '部署更新 ' + new Date().toISOString(),
  dotfiles: true // 包含以.开头的文件（如.nojekyll）
}, function(err) {
  if (err) {
    console.error('部署失败:', err);
    process.exit(1);
  }
  console.log('已成功部署到GitHub Pages!');
});
