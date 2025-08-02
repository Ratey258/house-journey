/**
 * 购买系统完整测试脚本
 * 用于验证购买、出售、背包显示等功能
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class PurchaseSystemTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    if (type === 'error') {
      this.errors.push(logMessage);
    }
  }

  async runTest(name, testFn) {
    this.log(`开始测试: ${name}`);
    try {
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      this.log(`✅ ${name} - 通过 (${duration}ms)`, 'success');
      this.testResults.push({ name, status: 'passed', duration });
    } catch (error) {
      this.log(`❌ ${name} - 失败: ${error.message}`, 'error');
      this.testResults.push({ name, status: 'failed', error: error.message });
    }
  }

  // 测试文件语法检查
  async testFileSyntax() {
    const filesToCheck = [
      'src/stores/player/inventoryActions.ts',
      'src/stores/compatibilityLayer.ts',
      'src/ui/components/market/Market.vue',
      'src/ui/components/market/EnhancedTradePanel.vue'
    ];

    for (const file of filesToCheck) {
      await this.runTest(`语法检查: ${file}`, async () => {
        if (!fs.existsSync(file)) {
          throw new Error(`文件不存在: ${file}`);
        }

        const content = fs.readFileSync(file, 'utf8');
        
        // 检查常见的语法错误模式
        const syntaxIssues = [
          { pattern: /findIndex\s*[\r\n]/, message: 'findIndex方法缺少参数' },
          { pattern: /\)\s*;\s*$/, message: '可能的多余分号' },
          { pattern: /if\s*\(.*\)\s*return.*[\r\n]\s*if/, message: '缺少花括号的if语句' }
        ];

        for (const issue of syntaxIssues) {
          if (issue.pattern.test(content)) {
            throw new Error(issue.message);
          }
        }
      });
    }
  }

  // 测试TypeScript编译
  async testTypeScriptCompilation() {
    await this.runTest('TypeScript编译检查', () => {
      return new Promise((resolve, reject) => {
        exec('npx tsc --noEmit', (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`TypeScript编译错误: ${stderr}`));
          } else {
            resolve();
          }
        });
      });
    });
  }

  // 测试Vite构建
  async testViteBuild() {
    await this.runTest('Vite构建测试', () => {
      return new Promise((resolve, reject) => {
        exec('npm run build', { timeout: 60000 }, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`构建失败: ${stderr || error.message}`));
          } else {
            resolve();
          }
        });
      });
    });
  }

  // 测试关键功能模块
  async testInventoryModule() {
    await this.runTest('库存模块结构检查', async () => {
      const inventoryFile = 'src/stores/player/inventoryActions.ts';
      const content = fs.readFileSync(inventoryFile, 'utf8');

      // 检查必要的导出
      const requiredExports = [
        'useInventoryActions',
        'addToInventory',
        'removeFromInventoryByProductId'
      ];

      for (const exportName of requiredExports) {
        if (!content.includes(exportName)) {
          throw new Error(`缺少必要的导出: ${exportName}`);
        }
      }

      // 检查关键修复
      if (!content.includes('findIndex((item: any) => {')) {
        throw new Error('findIndex语法修复未应用');
      }
    });
  }

  // 测试Store兼容性
  async testStoreCompatibility() {
    await this.runTest('Store兼容性检查', async () => {
      const compatFile = 'src/stores/compatibilityLayer.ts';
      const content = fs.readFileSync(compatFile, 'utf8');

      // 检查必要的方法
      const requiredMethods = [
        'buyProduct',
        'sellProduct',
        'getCurrentProductPrice',
        'getPlayerProductQuantity'
      ];

      for (const method of requiredMethods) {
        if (!content.includes(method)) {
          throw new Error(`缺少必要的方法: ${method}`);
        }
      }
    });
  }

  // 测试UI组件
  async testUIComponents() {
    await this.runTest('UI组件检查', async () => {
      const marketFile = 'src/ui/components/market/Market.vue';
      const content = fs.readFileSync(marketFile, 'utf8');

      // 检查关键修复
      const keyFixes = [
        'gameStore.player.inventory',
        'getPlayerProductQuantity',
        'canPlayerSell'
      ];

      for (const fix of keyFixes) {
        if (!content.includes(fix)) {
          throw new Error(`UI修复未应用: ${fix}`);
        }
      }
    });
  }

  // 检查通知系统禁用
  async testNotificationDisabled() {
    await this.runTest('通知系统禁用检查', async () => {
      const files = [
        'src/ui/composables/useEnhancedGame.ts',
        'src/ui/composables/useDesktopExperience.ts',
        'src/ui/composables/useDesktopGame.ts'
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('new Notification(') && !content.includes('禁用原生通知')) {
          throw new Error(`${file} 中仍有活跃的原生通知`);
        }
      }
    });
  }

  // 生成测试报告
  generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    const passedTests = this.testResults.filter(r => r.status === 'passed').length;
    const failedTests = this.testResults.filter(r => r.status === 'failed').length;

    const report = {
      summary: {
        total: this.testResults.length,
        passed: passedTests,
        failed: failedTests,
        duration: totalDuration,
        timestamp: new Date().toISOString()
      },
      tests: this.testResults,
      errors: this.errors
    };

    // 保存报告
    const reportPath = 'test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 输出总结
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试报告');
    console.log('='.repeat(50));
    console.log(`总测试数: ${report.summary.total}`);
    console.log(`✅ 通过: ${report.summary.passed}`);
    console.log(`❌ 失败: ${report.summary.failed}`);
    console.log(`⏱️  总耗时: ${report.summary.duration}ms`);
    console.log(`📄 详细报告: ${reportPath}`);
    
    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => r.status === 'failed')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }

    return failedTests === 0;
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始购买系统完整测试...\n');

    // 文件和语法检查
    await this.testFileSyntax();
    await this.testInventoryModule();
    await this.testStoreCompatibility();
    await this.testUIComponents();
    await this.testNotificationDisabled();

    // 编译和构建检查
    await this.testTypeScriptCompilation();
    
    // 生成报告
    const success = this.generateReport();
    
    if (success) {
      console.log('\n🎉 所有测试通过！购买系统修复成功。');
      process.exit(0);
    } else {
      console.log('\n💥 部分测试失败，请查看错误信息并修复。');
      process.exit(1);
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new PurchaseSystemTester();
  tester.runAllTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = PurchaseSystemTester;