const { execSync } = require('child_process');

// 构建项目
console.log('⚙️ 构建项目...');
execSync('npm run build', { stdio: 'inherit' });

// 运行修复脚本
console.log('🔧 修复部署问题...');
execSync('node fix-gh-pages-complete.js', { stdio: 'inherit' });

// 部署到GitHub Pages
console.log('🚀 部署到GitHub Pages...');
execSync('npx gh-pages -d dist', { stdio: 'inherit' });

console.log('✅ 部署完成！');
console.log('🌐 网站地址: https://ratey258.github.io/house-journey/');
