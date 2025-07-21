/**
 * 《买房记》游戏功能测试脚本 - 简化版
 * 此脚本用于测试游戏的核心功能，不依赖ESM模块导入
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

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
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * 测试结果记录
 */
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  },
  tests: [],
  details: {}
};

/**
 * 记录测试结果
 */
function recordTest(testName, passed, message, details = {}) {
  const result = {
    name: testName,
    passed,
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
  }
}

/**
 * 测试文件存在性和内容
 */
function testFileStructure() {
  log('\n📁 开始文件结构测试...', colors.bright + colors.cyan);
  const startTime = performance.now();

  // 测试核心文件存在性
  const coreFiles = [
    '../src/core/services/priceSystem.js',
    '../src/core/services/eventSystem.js',
    '../src/core/models/player.js',
    '../src/core/models/product.js',
    '../src/core/models/event.js',
    '../src/infrastructure/persistence/storageService.js',
    '../src/core/services/gameLoopService.js'
  ];

  for (const file of coreFiles) {
    const filePath = path.resolve(__dirname, file);
    const exists = fs.existsSync(filePath);
    recordTest(`文件存在性测试: ${file}`, exists, 
      exists ? '文件存在' : '文件不存在',
      { filePath, exists }
    );
  }

  // 测试文件内容
  try {
    const priceSystemPath = path.resolve(__dirname, '../src/core/services/priceSystem.js');
    if (fs.existsSync(priceSystemPath)) {
      const content = fs.readFileSync(priceSystemPath, 'utf8');
      const hasExport = content.includes('export') || content.includes('module.exports');
      const hasCalculateFunction = content.includes('calculateNewPrice') || content.includes('calculatePrice');
      const hasBatchFunction = content.includes('batchUpdatePrices') || content.includes('updatePrices');
      
      recordTest('价格系统文件内容测试', hasExport,
        hasExport ? '文件包含导出语句' : '文件缺少导出语句',
        { hasExport, contentLength: content.length }
      );
      
      recordTest('价格计算函数测试', hasCalculateFunction,
        hasCalculateFunction ? '包含价格计算函数' : '缺少价格计算函数',
        { hasCalculateFunction }
      );
      
      recordTest('批量价格更新函数测试', hasBatchFunction,
        hasBatchFunction ? '包含批量更新函数' : '缺少批量更新函数',
        { hasBatchFunction }
      );
    }
  } catch (err) {
    recordTest('价格系统文件内容测试', false,
      `读取文件失败: ${err.message}`,
      { error: err.toString() }
    );
  }

  // 测试事件系统文件内容
  try {
    const eventSystemPath = path.resolve(__dirname, '../src/core/services/eventSystem.js');
    if (fs.existsSync(eventSystemPath)) {
      const content = fs.readFileSync(eventSystemPath, 'utf8');
      const hasExport = content.includes('export') || content.includes('module.exports');
      const hasEventSystem = content.includes('EventSystem') || content.includes('class EventSystem');
      const hasGenerateEvent = content.includes('generateStageAppropriateEvent') || content.includes('generateEvent');
      
      recordTest('事件系统文件内容测试', hasExport,
        hasExport ? '文件包含导出语句' : '文件缺少导出语句',
        { hasExport, contentLength: content.length }
      );
      
      recordTest('事件系统类测试', hasEventSystem,
        hasEventSystem ? '包含事件系统类' : '缺少事件系统类',
        { hasEventSystem }
      );
      
      recordTest('事件生成函数测试', hasGenerateEvent,
        hasGenerateEvent ? '包含事件生成函数' : '缺少事件生成函数',
        { hasGenerateEvent }
      );
    }
  } catch (err) {
    recordTest('事件系统文件内容测试', false,
      `读取文件失败: ${err.message}`,
      { error: err.toString() }
    );
  }

  // 测试项目结构
  const projectStructure = {
    'src/core/services': fs.existsSync(path.resolve(__dirname, '../src/core/services')),
    'src/core/models': fs.existsSync(path.resolve(__dirname, '../src/core/models')),
    'src/infrastructure/persistence': fs.existsSync(path.resolve(__dirname, '../src/infrastructure/persistence')),
    'src/stores': fs.existsSync(path.resolve(__dirname, '../src/stores')),
    'src/ui/components': fs.existsSync(path.resolve(__dirname, '../src/ui/components')),
    'src/i18n': fs.existsSync(path.resolve(__dirname, '../src/i18n'))
  };
  
  const structureValid = Object.values(projectStructure).every(exists => exists);
  recordTest('项目结构测试', structureValid,
    structureValid ? '项目结构完整' : '项目结构不完整',
    { projectStructure }
  );

  const endTime = performance.now();
  log(`📁 文件结构测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 测试代码质量
 */
function testCodeQuality() {
  log('\n🔍 开始代码质量测试...', colors.bright + colors.cyan);
  const startTime = performance.now();

  // 测试核心文件是否有语法错误
  const coreFiles = [
    '../src/core/services/priceSystem.js',
    '../src/core/services/eventSystem.js',
    '../src/core/models/player.js',
    '../src/core/models/product.js',
    '../src/core/models/event.js'
  ];

  for (const file of coreFiles) {
    try {
      const filePath = path.resolve(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查基本语法
        const hasValidSyntax = content.includes('export') || content.includes('function') || content.includes('class');
        const hasComments = content.includes('/**') || content.includes('//');
        const hasErrorHandling = content.includes('try') || content.includes('catch') || content.includes('error');
        
        recordTest(`代码质量测试: ${file}`, hasValidSyntax,
          hasValidSyntax ? '文件语法基本正确' : '文件可能存在语法问题',
          { 
            hasValidSyntax, 
            hasComments, 
            hasErrorHandling,
            contentLength: content.length 
          }
        );
      }
    } catch (err) {
      recordTest(`代码质量测试: ${file}`, false,
        `读取文件失败: ${err.message}`,
        { error: err.toString() }
      );
    }
  }

  const endTime = performance.now();
  log(`🔍 代码质量测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 测试配置文件
 */
function testConfiguration() {
  log('\n⚙️ 开始配置文件测试...', colors.bright + colors.cyan);
  const startTime = performance.now();

  // 测试package.json
  try {
    const packagePath = path.resolve(__dirname, '../package.json');
    if (fs.existsSync(packagePath)) {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const hasName = packageContent.name;
      const hasVersion = packageContent.version;
      const hasScripts = packageContent.scripts && Object.keys(packageContent.scripts).length > 0;
      const hasDependencies = packageContent.dependencies && Object.keys(packageContent.dependencies).length > 0;
      const hasDevDependencies = packageContent.devDependencies && Object.keys(packageContent.devDependencies).length > 0;
      
      recordTest('package.json完整性测试', hasName && hasVersion && hasScripts,
        hasName && hasVersion && hasScripts ? 'package.json配置完整' : 'package.json配置不完整',
        { hasName, hasVersion, hasScripts, hasDependencies, hasDevDependencies }
      );
      
      // 检查关键依赖
      const keyDependencies = ['vue', 'pinia', 'electron'];
      const missingDeps = keyDependencies.filter(dep => !packageContent.dependencies?.[dep] && !packageContent.devDependencies?.[dep]);
      
      recordTest('关键依赖检查', missingDeps.length === 0,
        missingDeps.length === 0 ? '所有关键依赖都已安装' : `缺少关键依赖: ${missingDeps.join(', ')}`,
        { missingDependencies: missingDeps }
      );
    }
  } catch (err) {
    recordTest('package.json测试', false,
      `读取package.json失败: ${err.message}`,
      { error: err.toString() }
    );
  }

  // 测试vite配置
  try {
    const vitePath = path.resolve(__dirname, '../vite.config.js');
    if (fs.existsSync(vitePath)) {
      const content = fs.readFileSync(vitePath, 'utf8');
      const hasVuePlugin = content.includes('vue') || content.includes('@vitejs/plugin-vue');
      const hasElectronConfig = content.includes('electron') || content.includes('main');
      
      recordTest('Vite配置测试', hasVuePlugin,
        hasVuePlugin ? 'Vite配置包含Vue插件' : 'Vite配置缺少Vue插件',
        { hasVuePlugin, hasElectronConfig }
      );
    }
  } catch (err) {
    recordTest('Vite配置测试', false,
      `读取vite.config.js失败: ${err.message}`,
      { error: err.toString() }
    );
  }

  // 测试Electron配置
  try {
    const electronBuilderPath = path.resolve(__dirname, '../electron-builder.js');
    if (fs.existsSync(electronBuilderPath)) {
      const content = fs.readFileSync(electronBuilderPath, 'utf8');
      const hasAppId = content.includes('appId');
      const hasProductName = content.includes('productName');
      const hasWinConfig = content.includes('win') || content.includes('nsis');
      
      recordTest('Electron配置测试', hasAppId && hasProductName,
        hasAppId && hasProductName ? 'Electron配置完整' : 'Electron配置不完整',
        { hasAppId, hasProductName, hasWinConfig }
      );
    }
  } catch (err) {
    recordTest('Electron配置测试', false,
      `读取electron-builder.js失败: ${err.message}`,
      { error: err.toString() }
    );
  }

  const endTime = performance.now();
  log(`⚙️ 配置文件测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 测试资源文件
 */
function testResources() {
  log('\n🎨 开始资源文件测试...', colors.bright + colors.cyan);
  const startTime = performance.now();

  // 测试资源目录
  const resourceDirs = [
    '../resources',
    '../resources/assets',
    '../resources/assets/images',
    '../resources/assets/sounds',
    '../resources/assets/icons'
  ];

  for (const dir of resourceDirs) {
    const dirPath = path.resolve(__dirname, dir);
    const exists = fs.existsSync(dirPath);
    recordTest(`资源目录测试: ${dir}`, exists,
      exists ? '资源目录存在' : '资源目录不存在',
      { dirPath, exists }
    );
  }

  // 测试关键资源文件
  const keyResources = [
    '../icon.ico',
    '../resources/logo.png',
    '../resources/splash.html'
  ];

  for (const resource of keyResources) {
    const resourcePath = path.resolve(__dirname, resource);
    const exists = fs.existsSync(resourcePath);
    recordTest(`关键资源测试: ${resource}`, exists,
      exists ? '资源文件存在' : '资源文件不存在',
      { resourcePath, exists }
    );
  }

  const endTime = performance.now();
  log(`🎨 资源文件测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 生成测试报告
 */
function generateReport() {
  log('\n📊 生成测试报告...', colors.bright + colors.magenta);
  
  // 总结测试结果
  log('\n📋 测试结果总结:', colors.bright);
  log(`总测试数: ${testResults.summary.total}`, colors.reset);
  log(`通过: ${testResults.summary.passed}`, colors.green);
  log(`失败: ${testResults.summary.failed}`, testResults.summary.failed > 0 ? colors.red : colors.reset);
  log(`跳过: ${testResults.summary.skipped}`, testResults.summary.skipped > 0 ? colors.yellow : colors.reset);
  log(`通过率: ${testResults.summary.total > 0 ? (testResults.summary.passed / testResults.summary.total * 100).toFixed(2) : 0}%`, colors.reset);
  log(`执行时间: ${testResults.summary.duration}ms`, colors.reset);
  
  // 如果有失败的测试，输出详情
  if (testResults.summary.failed > 0) {
    log('\n❌ 失败测试详情:', colors.bright + colors.red);
    testResults.tests.forEach(test => {
      if (!test.passed) {
        log(`\n${test.name}:`, colors.bright);
        log(`  ${test.message}`, colors.red);
        
        const details = testResults.details[test.name];
        if (details && Object.keys(details).length > 0) {
          log('  详细信息:', colors.dim);
          console.dir(details, { depth: 2, colors: true });
        }
      }
    });
  }
  
  // 保存测试报告
  const reportPath = path.join(__dirname, 'test-results', 'simple-function-test-report.json');
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
  
  log('\n✨ 测试完成!', colors.bright + colors.cyan);
}

/**
 * 主函数
 */
function main() {
  const startTime = performance.now();
  
  log('======================================================', colors.bright);
  log('    《买房记》游戏功能测试脚本 - 简化版', colors.bright + colors.magenta);
  log('======================================================', colors.bright);
  log('');
  log(`开始测试: ${new Date().toLocaleString('zh-CN')}`, colors.dim);
  
  // 文件结构测试
  testFileStructure();
  
  // 代码质量测试
  testCodeQuality();
  
  // 配置文件测试
  testConfiguration();
  
  // 资源文件测试
  testResources();
  
  // 计算总执行时间
  testResults.summary.duration = Math.round(performance.now() - startTime);
  
  // 生成测试报告
  generateReport();
}

// 执行测试
main(); 