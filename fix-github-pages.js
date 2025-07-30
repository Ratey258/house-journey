const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

console.log('开始修复GitHub Pages部署问题...');

// 步骤1: 修复HTML文件中的资源路径
console.log('\n第一步: 修复HTML文件中的资源路径');
try {
  // 读取dist/index.html文件
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // 确保所有资源路径使用相对路径
  indexContent = indexContent.replace(/src="\//g, 'src="./');
  indexContent = indexContent.replace(/href="\//g, 'href="./');

  // 修复资源文件路径 - 特别是图片路径
  indexContent = indexContent.replace(/\/resources\//g, './resources/');

  // 处理可能的JSON数据中的路径
  indexContent = indexContent.replace(/"\/resources\//g, '"./resources/');

  // 添加错误处理和调试脚本
  const debugScript = `
<script>
  // 全局错误处理器
  window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error || e.message);
    const appElement = document.getElementById('app');
    if (appElement && (!appElement.children.length || appElement.innerHTML.trim() === '')) {
      appElement.innerHTML = '<div style="text-align:center;padding:20px;"><h2>加载出错</h2><p>请尝试刷新页面</p><p>错误信息: ' +
        (e.message || '未知错误') + '</p><button onclick="localStorage.clear();window.location.reload()">清除缓存并刷新</button></div>';
    }
  });

  // 图片错误处理
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.onerror = function() {
          console.error('图片加载失败:', img.src);
          // 尝试修复路径
          if (img.src.includes('/resources/')) {
            const newSrc = img.src.replace('/resources/', './resources/');
            console.log('尝试修复图片路径:', img.src, '->', newSrc);
            img.src = newSrc;
          }
        };
      });
    }, 1000);
  });
</script>`;

  // 将调试脚本添加到HTML的头部
  indexContent = indexContent.replace('</head>', debugScript + '</head>');

  // 写回文件
  fs.writeFileSync(indexPath, indexContent);
  console.log('- HTML文件路径修复完成');

  // 创建404.html
  const notFoundPath = path.join(__dirname, 'dist', '404.html');
  fs.writeFileSync(notFoundPath, indexContent);
  console.log('- 404.html文件创建完成');

  // 创建.nojekyll文件，确保GitHub Pages不使用Jekyll处理
  fs.writeFileSync(path.join(__dirname, 'dist', '.nojekyll'), '');
  console.log('- .nojekyll文件创建完成');

} catch (error) {
  console.error('HTML文件修复失败:', error);
  process.exit(1);
}

// 步骤2: 修复JavaScript文件中的资源路径
console.log('\n第二步: 修复JavaScript文件中的资源路径');
try {
  // 获取所有JS文件
  const jsFiles = glob.sync(path.join(__dirname, 'dist', 'assets', '*.js'));
  console.log(`- 找到 ${jsFiles.length} 个JavaScript文件待处理`);

  let fixedFilesCount = 0;

  jsFiles.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');

      // 记录原始大小
      const originalSize = content.length;

      // 修复资源路径 - 替换所有"/resources/"为"./resources/"
      let modifiedContent = content.replace(/['"]\/resources\//g, '"./resources/');

      // 特殊处理直接使用字符串拼接的情况
      modifiedContent = modifiedContent.replace(/\+\s*["']\/resources\//g, '+ "./resources/');

      // 如果有变更，写回文件
      if (modifiedContent !== content) {
        fs.writeFileSync(filePath, modifiedContent);
        fixedFilesCount++;
        console.log(`- 已修复: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.error(`处理文件时出错 ${path.basename(filePath)}:`, error.message);
    }
  });

  console.log(`- 已处理 ${jsFiles.length} 个文件，修复了 ${fixedFilesCount} 个文件的路径`);
} catch (error) {
  console.error('JavaScript文件修复失败:', error);
  process.exit(1);
}

// 步骤3: 复制资源文件
console.log('\n第三步: 确保资源文件存在于正确位置');
try {
  // 确保dist/resources目录存在
  const resourcesDir = path.join(__dirname, 'dist', 'resources');
  if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
    console.log('- 创建了dist/resources目录');
  }

  // 确保dist/resources/assets/images目录存在
  const imagesDir = path.join(resourcesDir, 'assets', 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('- 创建了dist/resources/assets/images目录');

    // 复制图片文件
    const sourceImagesDir = path.join(__dirname, 'resources', 'assets', 'images');
    if (fs.existsSync(sourceImagesDir)) {
      const imageFiles = fs.readdirSync(sourceImagesDir);
      imageFiles.forEach(file => {
        const sourcePath = path.join(sourceImagesDir, file);
        const destPath = path.join(imagesDir, file);
        fs.copyFileSync(sourcePath, destPath);
      });
      console.log(`- 已复制 ${imageFiles.length} 个图片文件到dist/resources/assets/images`);
    }
  }

  // 复制项目图标到dist目录
  const icoPath = path.join(__dirname, 'ico.ico');
  if (fs.existsSync(icoPath)) {
    fs.copyFileSync(icoPath, path.join(__dirname, 'dist', 'ico.ico'));
    console.log('- 已复制项目图标到dist目录');
  }
} catch (error) {
  console.error('资源文件复制失败:', error);
}

console.log('\n全部修复完成!');
console.log('现在可以运行 npx gh-pages -d dist 部署到GitHub Pages');
