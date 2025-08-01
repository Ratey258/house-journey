/**
 * 版本号同步脚本
 * 确保所有静态文件中的版本号与package.json保持一致
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取package.json获取当前版本
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const currentVersion = pkg.version;

console.log(`🔄 正在同步版本号到 v${currentVersion}...`);

// 需要更新的文件列表
const filesToUpdate = [
  {
    file: 'resources/splash.html',
    replacements: [
      { from: /v__VERSION__/g, to: `v${currentVersion}` }
    ]
  },
  {
    file: 'release/resources/splash.html',
    replacements: [
      { from: /v\d+\.\d+\.\d+/g, to: `v${currentVersion}` }
    ]
  },
  {
    file: 'release/package.json',
    replacements: [
      { from: /"version":\s*"[^"]*"/, to: `"version": "${currentVersion}"` }
    ]
  }
];

// 更新文件函数
function updateFile(fileInfo) {
  const filePath = path.join(__dirname, '..', fileInfo.file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${fileInfo.file}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    fileInfo.replacements.forEach(replacement => {
      const newContent = content.replace(replacement.from, replacement.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 已更新: ${fileInfo.file}`);
    } else {
      console.log(`📝 无需更新: ${fileInfo.file}`);
    }
  } catch (error) {
    console.error(`❌ 更新失败: ${fileInfo.file}`, error.message);
  }
}

// 执行更新
filesToUpdate.forEach(updateFile);

// 显示统一版本管理的优势
console.log(`
🎉 版本号同步完成！

📊 统一版本管理的优势：
✅ 单一数据源：package.json 是唯一的版本号来源
✅ 自动注入：Vite 构建时自动注入全局变量
✅ 零维护：修改 package.json 版本号，所有地方自动更新
✅ 类型安全：TypeScript 声明提供完整的类型支持
✅ 构建时优化：零运行时开销，编译时替换

🔧 技术实现：
- Vite define: 注入全局常量 __APP_VERSION__
- 环境变量: HTML 模板使用 %VITE_APP_TITLE%
- TypeScript: 全局变量类型声明
- 同步脚本: 处理非 Vite 文件的版本同步

💡 行业标准做法：
这是 Vue、React 等现代前端项目的标准版本管理方式
`);
