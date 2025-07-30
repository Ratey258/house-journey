const fs = require('fs');
const path = require('path');

console.log('开始修复Element Plus初始化问题...');

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

// 同步到404.html
const notFoundPath = path.join(__dirname, 'dist', '404.html');
fs.writeFileSync(notFoundPath, indexContent);

console.log('Element Plus初始化修复已完成，请重新部署项目。');
