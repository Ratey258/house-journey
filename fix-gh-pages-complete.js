const fs = require('fs');
const path = require('path');

console.log('开始全面修复GitHub Pages部署问题...');

// 第一步：检查并修复index.html
const indexPath = path.join(__dirname, 'dist', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// 修复所有资源路径
indexContent = indexContent.replace(/src="\//g, 'src="./');
indexContent = indexContent.replace(/href="\//g, 'href="./');
indexContent = indexContent.replace(/src=".\//g, 'src="./');
indexContent = indexContent.replace(/href=".\//g, 'href="./');
indexContent = indexContent.replace(/content="\//g, 'content="./');

// 添加高级错误处理和调试功能
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
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('全局错误:', { message, source, lineno, colno, error });

    // 尝试记录详细错误到控制台
    if (error && error.stack) {
      console.error('错误堆栈:', error.stack);
    }

    // 如果是与'xn'相关的错误，尝试修复
    if (message && (message.includes('xn') || message.includes('Cannot access') || message.includes('initialization'))) {
      if (window.__APP_CONFIG__.retryCount < window.__APP_CONFIG__.maxRetries) {
        console.log('检测到初始化错误，尝试重新加载应用...', window.__APP_CONFIG__.retryCount + 1);
        window.__APP_CONFIG__.retryCount++;
        // 添加一个随机参数来避免缓存
        window.location.href = window.location.href.split('?')[0] + '?retry=' + Date.now();
        return true;
      }
    }

    // 显示友好的错误消息
    const appElement = document.getElementById('app');
    if (appElement && (!appElement.children.length || appElement.innerHTML.trim() === '')) {
      appElement.innerHTML = \`
        <div style="text-align:center;padding:20px;font-family:Arial,sans-serif;">
          <h2 style="color:#e74c3c;">加载出错</h2>
          <p>应用加载过程中遇到问题</p>
          <div style="margin:15px;padding:10px;background:#f8f9fa;border-radius:4px;text-align:left;">
            <strong>错误信息:</strong> \${message || '未知错误'}<br>
            <strong>位置:</strong> \${source ? source.replace(window.location.origin, '') : '未知'} (\${lineno || 0}:\${colno || 0})
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
    return true;
  };

  // 处理未捕获的Promise异常
  window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise异常:', event.reason);
    if (event.reason && event.reason.stack) {
      console.error('Promise异常堆栈:', event.reason.stack);
    }
  });

  // 定义CSS加载重试函数
  window.__retryLoadCSS = function(url, retries = 3) {
    return new Promise((resolve, reject) => {
      let attempt = 0;
      function tryLoad() {
        attempt++;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url + (url.includes('?') ? '&' : '?') + 'retry=' + attempt;
        link.onload = () => resolve(link);
        link.onerror = () => {
          if (attempt < retries) {
            console.log(\`CSS加载失败，尝试重新加载 \${url} (尝试 \${attempt}/\${retries})\`);
            setTimeout(tryLoad, 1000);
          } else {
            reject(new Error(\`无法加载CSS: \${url}\`));
          }
        };
        document.head.appendChild(link);
      }
      tryLoad();
    });
  };

  // 定义JS加载重试函数
  window.__retryLoadJS = function(url, retries = 3) {
    return new Promise((resolve, reject) => {
      let attempt = 0;
      function tryLoad() {
        attempt++;
        const script = document.createElement('script');
        script.src = url + (url.includes('?') ? '&' : '?') + 'retry=' + attempt;
        script.async = true;
        script.onload = () => resolve(script);
        script.onerror = () => {
          if (attempt < retries) {
            console.log(\`JS加载失败，尝试重新加载 \${url} (尝试 \${attempt}/\${retries})\`);
            setTimeout(tryLoad, 1000);
          } else {
            reject(new Error(\`无法加载JS: \${url}\`));
          }
        };
        document.body.appendChild(script);
      }
      tryLoad();
    });
  };

  // 定义初始化钩子
  window.__initializeApp = function() {
    console.log('应用初始化中...');

    // 检测加载状态
    let loadingCheckInterval = setInterval(function() {
      const appElement = document.getElementById('app');
      if (appElement && appElement.children.length > 0) {
        console.log('应用已成功加载');
        clearInterval(loadingCheckInterval);
      }
    }, 1000);

    // 10秒后若仍未加载，显示超时信息
    setTimeout(function() {
      clearInterval(loadingCheckInterval);
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
  };

  // 页面加载完成后调用初始化
  window.addEventListener('DOMContentLoaded', function() {
    try {
      window.__initializeApp();
    } catch (e) {
      console.error('初始化失败:', e);
    }
  });
</script>
`;

// 添加脚本到文档头部
indexContent = indexContent.replace('</head>', debugScript + '</head>');

// 写回文件
fs.writeFileSync(indexPath, indexContent);
console.log('index.html 已修复');

// 创建对应的404.html
const notFoundPath = path.join(__dirname, 'dist', '404.html');
fs.writeFileSync(notFoundPath, indexContent);
console.log('404.html 已创建');

// 创建.nojekyll文件
fs.writeFileSync(path.join(__dirname, 'dist', '.nojekyll'), '');
console.log('.nojekyll 文件已创建');

// 可选：检查JavaScript文件中是否有特定错误模式
const jsDir = path.join(__dirname, 'dist', 'assets');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

console.log(`检查 ${jsFiles.length} 个JavaScript文件...`);

// 创建备份文件夹
const backupDir = path.join(__dirname, 'dist-backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// 备份原始文件
fs.copyFileSync(indexPath, path.join(backupDir, 'index.html'));
console.log('原始文件已备份到 dist-backup 文件夹');

console.log('修复完成！');
console.log('请使用 npx gh-pages -d dist 部署修复后的文件');
