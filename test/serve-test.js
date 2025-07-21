/**
 * 测试报告Web服务器
 * 用于在浏览器中查看测试报告
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 端口号
const PORT = 3000;

// 支持的MIME类型
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// 创建服务器
const server = http.createServer((req, res) => {
  // 解析URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // 默认为index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // 确定响应类型
  const ext = path.extname(pathname);
  const contentType = MIME_TYPES[ext] || 'text/plain';
  
  // 路径处理
  if (pathname === '/index.html') {
    // 动态生成首页
    generateIndexPage(res);
    return;
  }
  
  // 读取并返回文件
  let filePath;
  if (pathname.startsWith('/test-results/')) {
    // 测试结果目录
    filePath = path.join(__dirname, pathname.substring(1));
  } else if (pathname.startsWith('/reports/')) {
    // 直接访问报告文件
    filePath = path.join(__dirname, pathname.substring('/reports/'.length));
  } else if (pathname.startsWith('/resources/')) {
    // 资源文件
    filePath = path.join(__dirname, '..', pathname);
  } else {
    // 默认在测试目录查找
    filePath = path.join(__dirname, pathname.substring(1));
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>404 Not Found</h1><p>The requested resource was not found on this server.</p>');
      } else {
        // 服务器错误
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error: ' + err.message);
      }
      return;
    }
    
    // 发送文件内容
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.end(data);
  });
});

/**
 * 生成首页HTML
 * @param {http.ServerResponse} res 响应对象
 */
function generateIndexPage(res) {
  // 查找所有测试报告
  const testReports = [];
  
  // 诊断报告
  if (fs.existsSync(path.join(__dirname, 'diagnose-report.html'))) {
    testReports.push({
      name: '诊断报告',
      path: 'diagnose-report.html',
      type: 'HTML',
      timestamp: getFileModifiedTime(path.join(__dirname, 'diagnose-report.html'))
    });
  }
  
  // 测试结果目录中的JSON文件
  const testResultsDir = path.join(__dirname, 'test-results');
  if (fs.existsSync(testResultsDir)) {
    const files = fs.readdirSync(testResultsDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(testResultsDir, file);
        let reportType = '未知';
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          reportType = data.type || 'JSON';
        } catch (e) {
          // 忽略解析错误
        }
        
        testReports.push({
          name: file.replace('.json', ''),
          path: 'test-results/' + file,
          type: reportType,
          timestamp: getFileModifiedTime(filePath)
        });
      }
    });
  }
  
  // 生成HTML
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>《买房记》测试报告中心</title>
  <style>
    body {
      font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      color: #333;
      background-color: #f9f9f9;
    }
    .header {
      background-color: #0066cc;
      color: white;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background-color: #fff;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      margin: 0;
    }
    h2 {
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
      color: #0066cc;
    }
    .timestamp {
      font-size: 12px;
      color: #777;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .btn {
      display: inline-block;
      padding: 8px 16px;
      background-color: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    .btn:hover {
      background-color: #005bb5;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }
    .badge-html {
      background-color: #4caf50;
    }
    .badge-json {
      background-color: #ff9800;
    }
    .no-reports {
      text-align: center;
      padding: 30px;
      color: #777;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #777;
      border-top: 1px solid #eee;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>《买房记》测试报告中心</h1>
  </div>
  
  <div class="container">
    <div class="card">
      <h2>可用测试报告</h2>
      
      ${testReports.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>报告名称</th>
              <th>类型</th>
              <th>生成时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${testReports.map(report => `
              <tr>
                <td>${report.name}</td>
                <td>
                  <span class="badge badge-${report.type.toLowerCase()}">${report.type}</span>
                </td>
                <td>
                  <span class="timestamp">${report.timestamp}</span>
                </td>
                <td>
                  <a href="/${report.path}" class="btn">查看</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div class="no-reports">
          <p>暂无可用的测试报告</p>
        </div>
      `}
    </div>
    
    <div class="card">
      <h2>运行测试</h2>
      <p>要运行游戏诊断测试，请在命令行中执行以下命令：</p>
      <pre>cd test
.\diagnose.bat</pre>
    </div>
  </div>
  
  <div class="footer">
    <p>《买房记》0.1.0版本 - 测试报告服务</p>
  </div>
</body>
</html>
  `;
  
  // 发送HTML
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(html);
}

/**
 * 获取文件修改时间
 * @param {string} filePath 文件路径
 * @returns {string} 格式化的时间
 */
function getFileModifiedTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toLocaleString('zh-CN');
  } catch (err) {
    return '未知';
  }
}

// 启动服务器
server.listen(PORT, () => {
  console.log(`测试报告服务已启动: http://localhost:${PORT}`);
  console.log(`可以通过浏览器访问上述地址查看测试报告`);
  console.log(`按Ctrl+C可以退出服务`);
}); 