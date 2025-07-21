/**
 * 代码格式化脚本
 * 用于批量格式化项目中的代码文件
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 要格式化的目录
  directories: ['src', 'electron', 'test'],
  // 要格式化的文件扩展名
  extensions: ['.js', '.vue', '.css', '.scss', '.json'],
  // 是否修复ESLint问题
  fixEslint: true,
  // 是否使用Prettier格式化
  usePrettier: true
};

/**
 * 格式化代码
 */
function formatCode() {
  console.log('开始格式化代码...');
  
  try {
    // 运行ESLint修复
    if (CONFIG.fixEslint) {
      console.log('正在运行ESLint修复...');
      execSync('npm run lint:fix', { stdio: 'inherit' });
    }
    
    // 运行Prettier格式化
    if (CONFIG.usePrettier) {
      console.log('正在运行Prettier格式化...');
      execSync('npm run format', { stdio: 'inherit' });
    }
    
    console.log('代码格式化完成！');
  } catch (error) {
    console.error('代码格式化失败:', error.message);
    process.exit(1);
  }
}

/**
 * 检查代码格式
 */
function checkCodeFormat() {
  console.log('开始检查代码格式...');
  
  try {
    // 运行ESLint检查
    console.log('正在运行ESLint检查...');
    execSync('npm run lint', { stdio: 'inherit' });
    
    // 运行Prettier检查
    console.log('正在运行Prettier检查...');
    execSync('npm run format:check', { stdio: 'inherit' });
    
    console.log('代码格式检查通过！');
  } catch (error) {
    console.error('代码格式检查失败:', error.message);
    process.exit(1);
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'format':
      formatCode();
      break;
    case 'check':
      checkCodeFormat();
      break;
    default:
      console.log(`
用法:
  node scripts/format-code.js format  # 格式化代码
  node scripts/format-code.js check   # 检查代码格式
      `);
      break;
  }
}

// 执行主函数
main(); 