/**
 * 状态管理优化测试运行脚本
 * 用于从命令行运行状态管理优化测试
 */

import { runPerformanceTest } from './state-management-test.js';

// 设置环境变量
process.env.NODE_ENV = 'development';

// 运行测试
console.log('开始运行状态管理优化测试...');
runPerformanceTest()
  .then(() => {
    console.log('测试完成，退出程序');
    process.exit(0);
  })
  .catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  }); 