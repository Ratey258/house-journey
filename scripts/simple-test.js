/**
 * 简化的购买系统测试脚本
 * 检查关键文件的修复状态
 */

const fs = require('fs');
const path = require('path');

class SimpleSystemTest {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    if (type === 'error') {
      this.errors.push(logMessage);
    }
  }

  runTest(name, testFn) {
    this.log(`测试: ${name}`);
    try {
      testFn();
      this.log(`✅ ${name} - 通过`, 'success');
      this.testResults.push({ name, status: 'passed' });
      return true;
    } catch (error) {
      this.log(`❌ ${name} - 失败: ${error.message}`, 'error');
      this.testResults.push({ name, status: 'failed', error: error.message });
      return false;
    }
  }

  // 检查关键修复
  testInventoryActionsFix() {
    return this.runTest('库存操作语法修复', () => {
      const file = 'src/stores/player/inventoryActions.ts';
      if (!fs.existsSync(file)) {
        throw new Error(`文件不存在: ${file}`);
      }

      const content = fs.readFileSync(file, 'utf8');
      
      // 检查findIndex方法是否有正确的参数
      if (!content.includes('findIndex((item: any) => {')) {
        throw new Error('findIndex方法缺少正确的参数声明');
      }

      // 检查是否有语法错误模式
      if (content.includes('findIndex\n') || content.includes('findIndex\r\n')) {
        throw new Error('发现findIndex方法语法错误');
      }

      this.log('✓ findIndex方法语法正确');
    });
  }

  testMarketComponentFix() {
    return this.runTest('市场组件修复', () => {
      const file = 'src/ui/components/market/Market.vue';
      if (!fs.existsSync(file)) {
        throw new Error(`文件不存在: ${file}`);
      }

      const content = fs.readFileSync(file, 'utf8');
      
      // 检查关键修复
      const requiredFixes = [
        'inventory: []', // player默认值修复
        'gameStore.player.inventory', // 直接数据访问
        'nextTick' // 强制更新机制
      ];

      for (const fix of requiredFixes) {
        if (!content.includes(fix)) {
          throw new Error(`缺少重要修复: ${fix}`);
        }
      }

      this.log('✓ 市场组件关键修复已应用');
    });
  }

  testNotificationDisabled() {
    return this.runTest('通知系统禁用', () => {
      const files = [
        'src/ui/composables/useEnhancedGame.ts',
        'src/ui/composables/useDesktopExperience.ts',
        'src/ui/composables/useDesktopGame.ts'
      ];

      let disabledCount = 0;
      for (const file of files) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('禁用原生通知')) {
            disabledCount++;
          }
        }
      }

      if (disabledCount < 2) {
        throw new Error('原生通知系统未完全禁用');
      }

      this.log(`✓ ${disabledCount}个文件的原生通知已禁用`);
    });
  }

  testFileStructure() {
    return this.runTest('关键文件结构', () => {
      const requiredFiles = [
        'src/stores/compatibilityLayer.ts',
        'src/stores/player/inventoryActions.ts',
        'src/stores/player/playerState.ts',
        'src/ui/components/market/Market.vue',
        'src/ui/components/market/EnhancedTradePanel.vue'
      ];

      const missingFiles = [];
      for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
          missingFiles.push(file);
        }
      }

      if (missingFiles.length > 0) {
        throw new Error(`缺少关键文件: ${missingFiles.join(', ')}`);
      }

      this.log('✓ 所有关键文件存在');
    });
  }

  generateSummary() {
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const total = this.testResults.length;

    console.log('\n' + '='.repeat(50));
    console.log('📊 测试总结');
    console.log('='.repeat(50));
    console.log(`总测试数: ${total}`);
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => r.status === 'failed')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    } else {
      console.log('\n🎉 所有测试通过！');
    }

    return failed === 0;
  }

  runAllTests() {
    console.log('🚀 开始购买系统快速检查...\n');

    this.testFileStructure();
    this.testInventoryActionsFix();
    this.testMarketComponentFix();
    this.testNotificationDisabled();

    return this.generateSummary();
  }
}

// 运行测试
const tester = new SimpleSystemTest();
const success = tester.runAllTests();

process.exit(success ? 0 : 1);