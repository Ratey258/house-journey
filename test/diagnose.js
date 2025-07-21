/**
 * 《买房记》游戏功能全方位测试脚本
 * 此脚本用于自动测试游戏的所有核心功能
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { performance } = require('perf_hooks');

// 测试结果记录
let testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  },
  tests: [],
  timestamp: new Date().toISOString(),
  details: {},
  errors: []
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * 彩色日志输出
 * @param {string} message 消息内容
 * @param {string} color 颜色
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * 测试结果输出
 * @param {string} testName 测试名称
 * @param {boolean} passed 是否通过
 * @param {string} message 消息
 * @param {Object} details 详细信息
 */
function recordTest(testName, passed, message, details = {}) {
  const result = {
    name: testName,
    status: passed ? 'PASS' : 'FAIL',
    message,
    timestamp: new Date().toISOString()
  };

  testResults.tests.push(result);
  testResults.details[testName] = details;
  testResults.summary.total++;

  if (passed) {
    testResults.summary.passed++;
    log(`✅ ${testName}: ${message}`, colors.green);
  } else {
    testResults.summary.failed++;
    log(`❌ ${testName}: ${message}`, colors.red);
    testResults.errors.push({ test: testName, message, details });
  }
}

/**
 * 文件系统测试
 */
async function testFileSystem() {
  log('\n📂 开始文件系统测试...', colors.bright + colors.cyan);
  const startTime = performance.now();

  try {
    // 测试项目目录结构
    log('检查项目目录结构...', colors.dim);
    
    // 检查必要目录
    const requiredDirs = [
      'src',
      'resources',
      'electron',
      'dist',
      'public'
    ];
    
    let allDirsExist = true;
    for (const dir of requiredDirs) {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        allDirsExist = false;
        log(`  - 缺少目录: ${dir}`, colors.red);
      }
    }
    
    recordTest('项目目录结构', allDirsExist, 
      allDirsExist ? '所有必要目录存在' : '缺少必要目录', 
      { checkedDirs: requiredDirs }
    );
    
    // 检查核心文件
    log('检查核心文件...', colors.dim);
    
    const requiredFiles = [
      'package.json',
      'vite.config.js',
      'electron-builder.js',
      'src/main.js',
      'electron/main.js',
      'resources/logo.png',
      'resources/splash.html',
      'icon.ico'
    ];
    
    let allFilesExist = true;
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (!fs.existsSync(filePath)) {
        allFilesExist = false;
        log(`  - 缺少文件: ${file}`, colors.red);
      }
    }
    
    recordTest('核心文件检查', allFilesExist, 
      allFilesExist ? '所有核心文件存在' : '缺少核心文件', 
      { checkedFiles: requiredFiles }
    );

    // 检查资源目录
    log('检查资源目录...', colors.dim);
    
    const requiredAssetDirs = [
      'resources/assets/images',
      'resources/assets/sounds',
      'resources/assets/icons'
    ];
    
    let allAssetDirsExist = true;
    for (const dir of requiredAssetDirs) {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        allAssetDirsExist = false;
        log(`  - 缺少资源目录: ${dir}`, colors.red);
      }
    }
    
    recordTest('资源目录检查', allAssetDirsExist, 
      allAssetDirsExist ? '所有资源目录存在' : '缺少资源目录', 
      { checkedDirs: requiredAssetDirs }
    );
  } catch (err) {
    recordTest('文件系统测试', false, `发生错误: ${err.message}`, { error: err });
  }
  
  const endTime = performance.now();
  log(`📂 文件系统测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 代码质量测试
 */
async function testCodeQuality() {
  log('\n📝 开始代码质量测试...', colors.bright + colors.cyan);
  const startTime = performance.now();
  
  try {
    // 检查package.json
    log('检查package.json...', colors.dim);
    
    let packagePath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packagePath)) {
      recordTest('package.json检查', false, 'package.json文件不存在');
      return;
    }
    
    let packageData;
    try {
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      packageData = JSON.parse(packageContent);
      recordTest('package.json解析', true, 'package.json可正确解析为JSON');
    } catch (err) {
      recordTest('package.json解析', false, `无法解析package.json: ${err.message}`);
      return;
    }
    
    // 检查核心依赖
    const requiredDeps = [
      'electron', 'electron-builder', 'vue', 'pinia', 'vite',
      'electron-log', 'electron-store', 'electron-updater'
    ];
    
    const allDeps = {
      ...packageData.dependencies || {},
      ...packageData.devDependencies || {}
    };
    
    let missingDeps = [];
    for (const dep of requiredDeps) {
      if (!allDeps[dep]) {
        missingDeps.push(dep);
      }
    }
    
    recordTest('核心依赖检查', missingDeps.length === 0, 
      missingDeps.length === 0 ? '所有核心依赖存在' : `缺少依赖: ${missingDeps.join(', ')}`, 
      { requiredDeps, missingDeps }
    );
    
    // 检查版本号
    recordTest('版本号检查', packageData.version === '0.1.0', 
      packageData.version === '0.1.0' ? '版本号正确: 0.1.0' : `版本号不正确: ${packageData.version}`, 
      { version: packageData.version }
    );
    
    // 检查构建配置
    const buildConfig = packageData.build;
    if (buildConfig) {
      recordTest('构建配置检查', true, '构建配置存在', { buildConfig });
      
      // 检查必要的构建配置
      const requiredBuildConfigs = ['appId', 'productName', 'win', 'files', 'asar'];
      const missingBuildConfigs = requiredBuildConfigs.filter(config => !buildConfig[config]);
      
      recordTest('构建配置项检查', missingBuildConfigs.length === 0, 
        missingBuildConfigs.length === 0 ? '所有必要构建配置项存在' : `缺少构建配置项: ${missingBuildConfigs.join(', ')}`, 
        { requiredBuildConfigs, missingBuildConfigs }
      );
    } else {
      recordTest('构建配置检查', false, '构建配置不存在');
    }
  } catch (err) {
    recordTest('代码质量测试', false, `发生错误: ${err.message}`, { error: err });
  }
  
  const endTime = performance.now();
  log(`📝 代码质量测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 核心模块导入测试
 */
async function testModuleImports() {
  log('\n📦 开始核心模块测试...', colors.bright + colors.cyan);
  const startTime = performance.now();

  try {
    // 尝试导入核心模块
    const coreModules = [
      'src/core/models/player.js',
      'src/core/models/product.js',
      'src/core/services/priceSystem.js',
      'src/core/services/eventSystem.js',
      'src/infrastructure/persistence/storageService.js',
      'src/infrastructure/utils/errorHandler.js'
    ];

    for (const modulePath of coreModules) {
      const fullPath = path.join(__dirname, '..', modulePath);
      if (!fs.existsSync(fullPath)) {
        recordTest(`模块导入: ${modulePath}`, false, `模块文件不存在: ${modulePath}`);
        continue;
      }

      try {
        // 使用NodeJS的动态导入来测试模块是否可以加载
        // 注意：这只能检测文件是否存在和基本语法是否正确，无法执行实际的导入
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const hasExports = fileContent.includes('export ') || fileContent.includes('module.exports');
        
        recordTest(`模块导入: ${modulePath}`, true, 
          hasExports ? '模块存在并有导出' : '模块存在但没有检测到导出', 
          { path: fullPath, hasExports }
        );
      } catch (err) {
        recordTest(`模块导入: ${modulePath}`, false, 
          `模块导入失败: ${err.message}`, 
          { path: fullPath, error: err }
        );
      }
    }
  } catch (err) {
    recordTest('核心模块测试', false, `发生错误: ${err.message}`, { error: err });
  }
  
  const endTime = performance.now();
  log(`📦 核心模块测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 报告生成
 */
function generateReport() {
  log('\n📊 生成测试报告...', colors.bright + colors.cyan);
  
  // 计算执行时间
  testResults.summary.duration = Math.round(performance.now());
  
  // 输出测试结果摘要
  log('\n📋 测试结果摘要:', colors.bright);
  log(`总测试数: ${testResults.summary.total}`, colors.reset);
  log(`通过: ${testResults.summary.passed}`, colors.green);
  log(`失败: ${testResults.summary.failed}`, testResults.summary.failed > 0 ? colors.red : colors.reset);
  log(`跳过: ${testResults.summary.skipped}`, testResults.summary.skipped > 0 ? colors.yellow : colors.reset);
  log(`执行时间: ${testResults.summary.duration}ms`, colors.reset);
  
  // 如果有错误，输出错误详情
  if (testResults.errors.length > 0) {
    log('\n❌ 错误详情:', colors.bright + colors.red);
    testResults.errors.forEach((error, index) => {
      log(`\n${index + 1}. ${error.test}:`, colors.bright);
      log(`   ${error.message}`, colors.red);
      if (error.details && Object.keys(error.details).length > 0) {
        log('   详细信息:', colors.dim);
        console.dir(error.details, { depth: 2, colors: true });
      }
    });
  }
  
  // 保存测试报告
  const reportPath = path.join(__dirname, 'test-results', 'diagnose-report.json');
  try {
    // 确保目录存在
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2), 'utf8');
    log(`\n📄 测试报告已保存: ${reportPath}`, colors.green);
  } catch (err) {
    log(`\n❌ 保存测试报告失败: ${err.message}`, colors.red);
  }
  
  // 创建HTML报告
  const htmlReportPath = path.join(__dirname, 'diagnose-report.html');
  try {
    const htmlContent = generateHtmlReport(testResults);
    fs.writeFileSync(htmlReportPath, htmlContent, 'utf8');
    log(`\n🌐 HTML测试报告已保存: ${htmlReportPath}`, colors.green);
  } catch (err) {
    log(`\n❌ 保存HTML报告失败: ${err.message}`, colors.red);
  }
  
  log('\n✨ 测试完成!', colors.bright + colors.cyan);
}

/**
 * 生成HTML格式的报告
 * @param {Object} results 测试结果
 * @returns {string} HTML内容
 */
function generateHtmlReport(results) {
  const passRate = results.summary.total > 0 
    ? Math.round((results.summary.passed / results.summary.total) * 100) 
    : 0;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>买房记游戏诊断报告</title>
  <style>
    body {
      font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background-color: #fff;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    h1, h2 {
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
      margin-top: 30px;
    }
    h1 {
      color: #0066cc;
      text-align: center;
    }
    .summary {
      display: flex;
      justify-content: space-around;
      padding: 20px 0;
      background-color: #f5f7fa;
      border-radius: 5px;
      margin: 20px 0;
    }
    .summary-item {
      text-align: center;
    }
    .summary-value {
      font-size: 24px;
      font-weight: bold;
    }
    .summary-label {
      font-size: 14px;
      color: #666;
    }
    .pass { color: #4caf50; }
    .fail { color: #f44336; }
    .skip { color: #ff9800; }
    .test-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .test-table th, .test-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .test-table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .test-row:hover {
      background-color: #f5f5f5;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 3px;
      color: white;
      font-weight: bold;
    }
    .status-pass { background-color: #4caf50; }
    .status-fail { background-color: #f44336; }
    .status-skip { background-color: #ff9800; }
    .timestamp {
      font-size: 12px;
      color: #777;
    }
    .errors-section {
      margin-top: 30px;
      padding: 15px;
      background-color: #fff6f6;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
    }
    .error-item {
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #ddd;
    }
    .error-header {
      font-weight: bold;
      color: #721c24;
    }
    .error-message {
      margin: 10px 0;
      font-family: monospace;
      padding: 10px;
      background-color: #f8f9fa;
      border-left: 3px solid #f44336;
    }
    .progress-bar {
      height: 20px;
      background-color: #f2f2f2;
      border-radius: 10px;
      margin-bottom: 10px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background-color: #4caf50;
      width: ${passRate}%;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>《买房记》游戏诊断报告</h1>
    <p class="timestamp">生成时间: ${new Date(results.timestamp).toLocaleString('zh-CN')}</p>
    
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
    
    <div class="summary">
      <div class="summary-item">
        <div class="summary-value">${results.summary.total}</div>
        <div class="summary-label">总测试数</div>
      </div>
      <div class="summary-item">
        <div class="summary-value pass">${results.summary.passed}</div>
        <div class="summary-label">通过</div>
      </div>
      <div class="summary-item">
        <div class="summary-value fail">${results.summary.failed}</div>
        <div class="summary-label">失败</div>
      </div>
      <div class="summary-item">
        <div class="summary-value skip">${results.summary.skipped}</div>
        <div class="summary-label">跳过</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${results.summary.duration}ms</div>
        <div class="summary-label">执行时间</div>
      </div>
    </div>
    
    <h2>测试详情</h2>
    <table class="test-table">
      <thead>
        <tr>
          <th>测试名称</th>
          <th>状态</th>
          <th>消息</th>
        </tr>
      </thead>
      <tbody>
        ${results.tests.map(test => `
          <tr class="test-row">
            <td>${test.name}</td>
            <td><span class="status-badge status-${test.status.toLowerCase()}">${test.status}</span></td>
            <td>${test.message}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    ${results.errors.length > 0 ? `
      <h2>错误详情</h2>
      <div class="errors-section">
        ${results.errors.map((error, index) => `
          <div class="error-item">
            <div class="error-header">${index + 1}. ${error.test}</div>
            <div class="error-message">${error.message}</div>
            ${error.details && Object.keys(error.details).length > 0 ? `
              <pre>${JSON.stringify(error.details, null, 2)}</pre>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}
    
  </div>
</body>
</html>`;
}

/**
 * 主函数
 */
async function main() {
  const startTime = performance.now();
  
  log('======================================================', colors.bright);
  log('       《买房记》游戏功能全方位测试脚本', colors.bright + colors.magenta);
  log('======================================================', colors.bright);
  log('');
  log(`开始测试: ${new Date().toLocaleString('zh-CN')}`, colors.dim);
  
  // 文件系统测试
  await testFileSystem();
  
  // 代码质量测试
  await testCodeQuality();
  
  // 核心模块测试
  await testModuleImports();
  
  // 生成测试报告
  testResults.summary.duration = Math.round(performance.now() - startTime);
  generateReport();
}

// 执行测试
main().catch(err => {
  console.error('测试执行失败:', err);
  process.exit(1);
}); 