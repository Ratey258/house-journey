/**
 * 错误处理修复工具
 * 用于辅助修复项目中的try/catch块，添加标准错误处理
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
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
  tryCatchPattern: /try\s*{[\s\S]*?}\s*catch\s*\(([^\)]+)\)\s*{[\s\S]*?}/g,
  errorHandlerImport: "import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';",
  relativeErrorHandlerImport: (relativePath) => {
    // 计算从当前文件到errorHandler.js的相对路径
    return `import { handleError, ErrorType, ErrorSeverity } from '${relativePath}';`;
  }
};

/**
 * 分析文件内容，检测try/catch块
 * @param {string} content - 文件内容
 * @returns {Array} 找到的try/catch块信息
 */
function analyzeTryCatch(content) {
  const tryCatchMatches = [];
  let match;
  
  while ((match = CONFIG.tryCatchPattern.exec(content)) !== null) {
    const fullMatch = match[0];
    const errorVarName = match[1].trim(); // 捕获的错误变量名
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;
    
    tryCatchMatches.push({
      fullMatch,
      errorVarName,
      startIndex,
      endIndex
    });
  }
  
  return tryCatchMatches;
}

/**
 * 添加错误处理器导入
 * @param {string} content - 文件内容
 * @param {string} filePath - 文件路径
 * @returns {string} 更新后的内容
 */
function addErrorHandlerImport(content, filePath) {
  // 如果已经导入了handleError，不再添加
  if (content.includes('handleError') && 
      (content.includes('@/infrastructure/utils/errorHandler') || 
       content.includes('../infrastructure/utils/errorHandler'))) {
    return content;
  }
  
  // 计算从当前文件到errorHandler.js的相对路径
  const fileDir = path.dirname(filePath);
  const errorHandlerPath = path.join(CONFIG.rootDir, 'infrastructure/utils');
  const relativePath = path.relative(fileDir, errorHandlerPath).replace(/\\/g, '/');
  const importStatement = relativePath.startsWith('.') ? 
    CONFIG.relativeErrorHandlerImport(relativePath + '/errorHandler') : 
    CONFIG.errorHandlerImport;
  
  // 查找适合插入import语句的位置
  const importRegex = /import\s+.*?from\s+['"].*?['"];?/g;
  let lastImportMatch = null;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    lastImportMatch = match;
  }
  
  if (lastImportMatch) {
    // 在最后一个import语句后插入
    const insertIndex = lastImportMatch.index + lastImportMatch[0].length;
    return content.slice(0, insertIndex) + '\n' + importStatement + content.slice(insertIndex);
  } else {
    // 如果没有import语句，在文件开头插入
    return importStatement + '\n\n' + content;
  }
}

/**
 * 修复try/catch块
 * @param {string} content - 文件内容 
 * @param {Array} tryCatchBlocks - try/catch块信息
 * @param {string} componentName - 组件名称
 * @returns {string} 修复后的内容
 */
function fixTryCatchBlocks(content, tryCatchBlocks, componentName) {
  // 从后往前处理，避免修改位置影响
  let result = content;
  
  for (let i = tryCatchBlocks.length - 1; i >= 0; i--) {
    const block = tryCatchBlocks[i];
    
    // 查找catch块中的代码
    const catchStart = block.fullMatch.indexOf(`catch (${block.errorVarName})`);
    if (catchStart === -1) continue;
    
    const catchBlockStart = block.fullMatch.indexOf('{', catchStart);
    const catchBlockEnd = block.fullMatch.lastIndexOf('}');
    
    if (catchBlockStart === -1 || catchBlockEnd === -1) continue;
    
    const catchBlockContent = block.fullMatch.substring(catchBlockStart + 1, catchBlockEnd).trim();
    
    // 如果catch块已经包含handleError，跳过
    if (catchBlockContent.includes('handleError(')) continue;
    
    // 为不同类型的catch块构建错误处理语句
    let errorContext = `'${componentName}'`;
    let errorType = 'ErrorType.UNKNOWN';
    let errorSeverity = 'ErrorSeverity.ERROR';
    
    // 根据catch块内容判断错误类型
    if (catchBlockContent.toLowerCase().includes('storage') || 
        catchBlockContent.toLowerCase().includes('localstorage')) {
      errorType = 'ErrorType.STORAGE';
    } else if (catchBlockContent.toLowerCase().includes('network') || 
               catchBlockContent.toLowerCase().includes('api') ||
               catchBlockContent.toLowerCase().includes('request')) {
      errorType = 'ErrorType.NETWORK';
    } else if (catchBlockContent.toLowerCase().includes('game') && 
               catchBlockContent.toLowerCase().includes('logic')) {
      errorType = 'ErrorType.GAME_LOGIC';
    }
    
    // 根据现有错误处理判断严重程度
    if (catchBlockContent.toLowerCase().includes('console.warn')) {
      errorSeverity = 'ErrorSeverity.WARNING';
    } else if (catchBlockContent.toLowerCase().includes('console.info')) {
      errorSeverity = 'ErrorSeverity.INFO';
    }
    
    // 构建错误处理语句
    const errorHandlerStatement = `handleError(${block.errorVarName}, ${errorContext}, ${errorType}, ${errorSeverity});\n    `;
    
    // 在catch块开头插入错误处理语句
    const newCatchBlock = block.fullMatch.substring(0, catchBlockStart + 1) + 
                          '\n    ' + errorHandlerStatement + 
                          catchBlockContent + 
                          block.fullMatch.substring(catchBlockEnd);
    
    // 替换原始的try/catch块
    result = result.substring(0, block.startIndex) + 
             newCatchBlock + 
             result.substring(block.endIndex);
  }
  
  return result;
}

/**
 * 处理单个文件
 * @param {string} filePath - 文件路径
 */
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const relativePath = path.relative(CONFIG.rootDir, filePath);
    
    // 提取组件名
    const fileName = path.basename(filePath);
    const dirName = path.basename(path.dirname(filePath));
    const componentName = fileName.split('.')[0] + (dirName !== '.' ? ` (${dirName})` : '');
    
    // 分析try/catch块
    const tryCatchBlocks = analyzeTryCatch(content);
    if (tryCatchBlocks.length === 0) {
      console.log(`文件 ${relativePath} 没有try/catch块，跳过。`);
      return { processed: false, message: '没有try/catch块' };
    }
    
    // 添加错误处理器导入
    let updatedContent = addErrorHandlerImport(content, filePath);
    
    // 修复try/catch块
    updatedContent = fixTryCatchBlocks(updatedContent, tryCatchBlocks, componentName);
    
    // 如果内容有变化，写入文件
    if (updatedContent !== content) {
      await writeFile(filePath, updatedContent, 'utf8');
      console.log(`✅ 成功修复 ${relativePath} (${tryCatchBlocks.length}个try/catch块)`);
      return { processed: true, count: tryCatchBlocks.length };
    } else {
      console.log(`🔍 检查了 ${relativePath} 但没有需要修改的地方`);
      return { processed: false, message: '没有需要修改的地方' };
    }
  } catch (err) {
    console.error(`❌ 处理文件 ${filePath} 出错:`, err);
    return { processed: false, error: err.message };
  }
}

/**
 * 处理指定的文件
 * @param {Array<string>} targetFiles - 要处理的文件路径列表
 */
async function processTargetFiles(targetFiles) {
  console.log(`\n准备处理 ${targetFiles.length} 个指定文件...\n`);
  
  let results = {
    total: targetFiles.length,
    processed: 0,
    fixed: 0,
    skipped: 0,
    failed: 0
  };
  
  for (const filePath of targetFiles) {
    const fullPath = path.resolve(CONFIG.rootDir, filePath);
    try {
      const fileStats = await stat(fullPath);
      if (!fileStats.isFile()) {
        console.log(`❌ 路径不是文件: ${filePath}`);
        results.skipped++;
        continue;
      }
      
      const result = await processFile(fullPath);
      results.processed++;
      
      if (result.processed) {
        results.fixed++;
      } else {
        results.skipped++;
      }
    } catch (err) {
      console.error(`❌ 无法处理文件 ${filePath}:`, err);
      results.failed++;
    }
  }
  
  console.log(`\n处理完成! 总结:`);
  console.log(`总文件数: ${results.total}`);
  console.log(`已处理: ${results.processed}`);
  console.log(`已修复: ${results.fixed}`);
  console.log(`已跳过: ${results.skipped}`);
  console.log(`失败: ${results.failed}`);
  
  return results;
}

/**
 * 主函数
 */
async function main() {
  // 要修复的目标文件（优先级从高到低）
  const targetFiles = [
    'infrastructure/persistence/storageService.js',
    'infrastructure/persistence/stateSnapshot.js',
    'ui/components/common/AudioManager.vue',
    'stores/persistence/saveSystem.js'
  ];
  
  if (process.argv.length > 2) {
    // 从命令行参数获取目标文件
    const customTargets = process.argv.slice(2);
    console.log(`使用指定的目标文件: ${customTargets.join(', ')}`);
    await processTargetFiles(customTargets);
  } else {
    // 使用默认目标文件
    console.log(`使用优先级文件列表: ${targetFiles.join(', ')}`);
    await processTargetFiles(targetFiles);
  }
}

// 执行主函数
main().catch(err => {
  console.error('错误处理修复工具执行失败:', err);
  process.exit(1);
}); 