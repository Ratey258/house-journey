const fs = require('fs');
const path = require('path');

// 读取dist/index.html文件
const indexPath = path.join(__dirname, 'dist', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// 确保所有资源路径使用相对路径
indexContent = indexContent.replace(/src="\//g, 'src="./');
indexContent = indexContent.replace(/href="\//g, 'href="./');

// 添加基本的错误处理
const errorHandlingScript = `
<script>
  window.addEventListener('error', function(e) {
    console.error('全局错误捕获:', e.error);
    if (document.getElementById('app').innerHTML === '') {
      document.getElementById('app').innerHTML = '<div style="text-align:center;padding:20px;"><h2>加载出错</h2><p>请尝试刷新页面</p><p>错误信息: ' + e.message + '</p></div>';
    }
  });
</script>
`;

// 将错误处理脚本添加到HTML的头部
indexContent = indexContent.replace('</head>', errorHandlingScript + '</head>');

// 写回index.html
fs.writeFileSync(indexPath, indexContent);

// 同样修改404.html
const notFoundPath = path.join(__dirname, 'dist', '404.html');
fs.writeFileSync(notFoundPath, indexContent);

console.log('完成GitHub Pages部署修复');
