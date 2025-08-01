/**
 * 项目文件清理工具
 * 用于删除过时的测试文件和脚本文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录
const rootDir = path.resolve(__dirname, '..');

// 要删除的过时测试文件列表
const outdatedTestFiles = [
  // 过时的测试脚本
  'test/manual-test.bat',
  'test/test-manual.bat',
  'test/manual-test-report.html',
  'test/simple-test.js',
  'test/run-simple-test.bat',
  'test/price-system-test.js',
  'test/serve-test.js',
  'test/optimize-summary.js',
  // 重复的测试结果
  'test/test-results/test-report-manual.json',
];

// 要删除的过时脚本文件列表
const outdatedScriptFiles = [
  // 临时重构脚本
  'scripts/restructure.js',
  // 旧版测试脚本
  'scripts/balance-test.js',
  'scripts/run-balance-test.bat',
  // 其他过时脚本
  'scripts/cleanup-empty-dirs.bat',
  'scripts/cleanup-empty-dirs.js',
  'scripts/create-missing-files.bat',
  'scripts/create-missing-files.js',
  'scripts/integrate-events.js',
];

// 要保留的空目录
const dirsToKeep = [
  'resources/assets/images',
  'resources/assets/sounds',
  'resources/assets/icons',
];

/**
 * 删除指定文件
 * @param {string} filePath 文件路径
 */
function deleteFile(filePath) {
  const fullPath = path.join(rootDir, filePath);

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ 已删除: ${filePath}`);
    } else {
      console.log(`❓ 文件不存在: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ 删除失败: ${filePath}`, err);
  }
}

/**
 * 确保目录存在并添加占位文件
 * @param {string} dirPath 目录路径
 */
function ensureDirectoryWithPlaceholder(dirPath) {
  const fullPath = path.join(rootDir, dirPath);
  const placeholderPath = path.join(fullPath, 'placeholder.txt');

  try {
    // 确保目录存在
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 创建目录: ${dirPath}`);
    }

    // 添加占位文件
    if (!fs.existsSync(placeholderPath)) {
      fs.writeFileSync(
        placeholderPath,
        `这是一个占位文件，确保${path.basename(dirPath)}目录存在。\n实际发布时，请替换为真实的资源。`,
        'utf8'
      );
      console.log(`📄 添加占位文件: ${dirPath}/placeholder.txt`);
    }
  } catch (err) {
    console.error(`❌ 处理目录失败: ${dirPath}`, err);
  }
}

/**
 * 清理项目文件
 */
function cleanup() {
  console.log('🧹 开始清理过时文件...');

  // 删除过时测试文件
  console.log('\n📋 清理过时测试文件:');
  outdatedTestFiles.forEach(deleteFile);

  // 删除过时脚本文件
  console.log('\n📋 清理过时脚本文件:');
  outdatedScriptFiles.forEach(deleteFile);

  // 确保必要的空目录存在
  console.log('\n📋 确保必要目录存在:');
  dirsToKeep.forEach(ensureDirectoryWithPlaceholder);

  console.log('\n✨ 清理完成!');
}

// 执行清理
cleanup();
