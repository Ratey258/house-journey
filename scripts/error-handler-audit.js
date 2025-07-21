/**
 * 错误处理审查工具
 * 用于扫描项目中未使用统一错误处理的try/catch块
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

// 配置
const CONFIG = {
  rootDir: path.resolve(__dirname, '../src'),
  ignorePatterns: [
    'node_modules',
    'dist',
    '.git',
    'test',
    'public'
  ],
  fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
  importPatterns: [
    // 绝对路径导入方式
    /import\s+{\s*([^}]*handleError|[^}]*withErrorHandling|[^}]*withGameErrorHandling)[^}]*}\s+from\s+['"]@\/infrastructure\/utils\/errorHandler['"]/,
    /import\s+errorHandler\s+from\s+['"]@\/infrastructure\/utils\/errorHandler['"]/,
    // 相对路径导入方式
    /import\s+{\s*([^}]*handleError|[^}]*withErrorHandling|[^}]*withGameErrorHandling)[^}]*}\s+from\s+['"]\.\.\/(\.\.\/)*infrastructure\/utils\/errorHandler['"]/,
    /import\s+errorHandler\s+from\s+['"]\.\.\/(\.\.\/)*infrastructure\/utils\/errorHandler['"]/
  ],
  tryCatchPattern: /try\s*{[\s\S]*?}\s*catch\s*\([^\)]+\)\s*{[\s\S]*?}/g,
  handleErrorPattern: /handleError\s*\(/,
  debugMode: true, // 启用调试输出
};

// 错误处理使用情况结果
const results = {
  filesWithoutErrorHandler: [],
  filesWithImportButNoUse: [],
  filesWithoutImportButWithTryCatch: [],
  tryCatchWithoutErrorHandler: []
};

/**
 * 递归扫描目录
 * @param {string} dir - 目录路径
 */
async function scanDir(dir) {
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = await stat(fullPath);
      
      // 检查是否为忽略的路径
      if (CONFIG.ignorePatterns.some(pattern => entry.includes(pattern))) {
        continue;
      }
      
      if (stats.isDirectory()) {
        await scanDir(fullPath); // 递归扫描子目录
      } else if (stats.isFile()) {
        const ext = path.extname(fullPath);
        if (CONFIG.fileExtensions.includes(ext)) {
          await scanFile(fullPath); // 扫描文件
        }
      }
    }
  } catch (err) {
    console.error(`扫描目录错误: ${dir}`, err);
  }
}

/**
 * 扫描单个文件
 * @param {string} filePath - 文件路径
 */
async function scanFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const relPath = path.relative(CONFIG.rootDir, filePath);
    
    if (CONFIG.debugMode) {
      console.log(`正在扫描文件: ${relPath}`);
    }
    
    // 检查是否导入了错误处理器
    const hasErrorHandlerImport = CONFIG.importPatterns.some(pattern => {
      const matches = pattern.test(content);
      if (matches && CONFIG.debugMode) {
        console.log(`  - 检测到错误处理器导入: ${relPath}`);
      }
      return matches;
    });
    
    // 查找所有try/catch块
    const tryCatchMatches = content.match(CONFIG.tryCatchPattern) || [];
    
    if (tryCatchMatches.length > 0 && CONFIG.debugMode) {
      console.log(`  - 发现 ${tryCatchMatches.length} 个try/catch块: ${relPath}`);
    }
    
    // 检查try/catch块中是否使用了handleError
    if (tryCatchMatches.length > 0) {
      const withoutErrorHandler = tryCatchMatches.filter(block => 
        !CONFIG.handleErrorPattern.test(block)
      );
      
      if (withoutErrorHandler.length > 0) {
        // 有try/catch但没有使用handleError
        if (CONFIG.debugMode) {
          console.log(`  - 发现 ${withoutErrorHandler.length} 个未处理的try/catch块: ${relPath}`);
        }
        
        results.tryCatchWithoutErrorHandler.push({
          file: relPath,
          count: withoutErrorHandler.length,
          examples: withoutErrorHandler.slice(0, 2).map(block => block.substring(0, 200) + (block.length > 200 ? '...' : ''))
        });
        
        if (!hasErrorHandlerImport) {
          // 没有导入错误处理器但有try/catch
          results.filesWithoutImportButWithTryCatch.push(relPath);
        }
      }
    }
    
    // 检查是否有导入但没有使用
    const usesErrorHandler = content.includes('handleError(') || 
                           content.includes('withErrorHandling(') || 
                           content.includes('withGameErrorHandling(');
                           
    if (hasErrorHandlerImport && tryCatchMatches.length === 0 && !usesErrorHandler) {
      if (CONFIG.debugMode) {
        console.log(`  - 导入了错误处理器但未使用: ${relPath}`);
      }
      results.filesWithImportButNoUse.push(relPath);
    }
  } catch (err) {
    console.error(`扫描文件错误: ${filePath}`, err);
  }
}

/**
 * 生成报告
 */
function generateReport() {
  console.log('\n========== 错误处理审查报告 ==========\n');
  
  console.log('发现的问题:');
  console.log('------------------------------\n');
  
  console.log(`1. 包含未处理try/catch的文件: ${results.tryCatchWithoutErrorHandler.length}个`);
  if (results.tryCatchWithoutErrorHandler.length > 0) {
    results.tryCatchWithoutErrorHandler.forEach(item => {
      console.log(`\n   📁 ${item.file} (${item.count}处未处理):`);
      item.examples.forEach((example, i) => {
        console.log(`     示例 ${i + 1}:\n     ${example.replace(/\n/g, '\n     ')}\n`);
      });
    });
  }
  
  console.log(`\n2. 没有导入错误处理器但有try/catch的文件: ${results.filesWithoutImportButWithTryCatch.length}个`);
  if (results.filesWithoutImportButWithTryCatch.length > 0) {
    results.filesWithoutImportButWithTryCatch.forEach(file => {
      console.log(`   - ${file}`);
    });
  }
  
  console.log(`\n3. 导入了错误处理器但未使用的文件: ${results.filesWithImportButNoUse.length}个`);
  if (results.filesWithImportButNoUse.length > 0) {
    results.filesWithImportButNoUse.forEach(file => {
      console.log(`   - ${file}`);
    });
  }
  
  console.log('\n========================================');
  console.log('建议操作:');
  console.log('1. 检查所有未处理的try/catch块，添加handleError调用');
  console.log('2. 在所有使用try/catch的文件中导入错误处理器');
  console.log('3. 移除未使用的错误处理器导入');
  console.log('========================================\n');
}

/**
 * 主函数
 */
async function main() {
  console.log('开始扫描错误处理使用情况...');
  console.log(`扫描目录: ${CONFIG.rootDir}`);
  
  try {
    const startTime = Date.now();
    await scanDir(CONFIG.rootDir);
    const duration = Date.now() - startTime;
    
    console.log(`扫描完成，用时 ${duration}ms`);
    console.log(`共扫描文件：${Object.keys(results).reduce((acc, key) => acc + results[key].length, 0)}个`);
    
    generateReport();
  } catch (err) {
    console.error('扫描过程中发生错误:', err);
  }
}

// 执行主函数
main().catch(err => {
  console.error('错误处理审查工具执行失败:', err);
  process.exit(1);
}); 