#!/usr/bin/env node

/**
 * 性能检查脚本
 * 分析构建产物并提供性能优化建议
 */

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

/**
 * 分析构建产物
 */
function analyzeBuildOutput() {
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ 构建目录不存在，请先运行 npm run build');
    process.exit(1);
  }
  
  console.log('🔍 开始分析构建产物...\n');
  
  const analysis = {
    assets: [],
    chunks: [],
    totalSize: 0,
    gzippedSize: 0,
    recommendations: []
  };
  
  // 递归分析文件
  function analyzeDirectory(dirPath, relativePath = '') {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const fileRelativePath = path.join(relativePath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        analyzeDirectory(filePath, fileRelativePath);
      } else {
        const content = fs.readFileSync(filePath);
        const gzipped = gzipSync(content);
        
        const fileInfo = {
          path: fileRelativePath,
          size: stats.size,
          gzippedSize: gzipped.length,
          type: getFileType(file),
          name: file
        };
        
        analysis.totalSize += stats.size;
        analysis.gzippedSize += gzipped.length;
        
        if (fileInfo.type === 'js' || fileInfo.type === 'css') {
          analysis.chunks.push(fileInfo);
        } else {
          analysis.assets.push(fileInfo);
        }
      }
    });
  }
  
  analyzeDirectory(distPath);
  
  return analysis;
}

/**
 * 获取文件类型
 */
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const typeMap = {
    '.js': 'js',
    '.css': 'css',
    '.html': 'html',
    '.png': 'image',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.gif': 'image',
    '.svg': 'image',
    '.ico': 'image',
    '.woff': 'font',
    '.woff2': 'font',
    '.ttf': 'font',
    '.eot': 'font',
    '.mp3': 'audio',
    '.wav': 'audio',
    '.ogg': 'audio'
  };
  
  return typeMap[ext] || 'other';
}

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 生成性能报告
 */
function generateReport(analysis) {
  console.log('📊 构建产物分析报告');
  console.log('=' .repeat(50));
  
  // 总体统计
  console.log(`\n📈 总体统计:`);
  console.log(`  原始大小: ${formatSize(analysis.totalSize)}`);
  console.log(`  压缩后大小: ${formatSize(analysis.gzippedSize)}`);
  console.log(`  压缩率: ${((1 - analysis.gzippedSize / analysis.totalSize) * 100).toFixed(1)}%`);
  
  // JS文件分析
  const jsChunks = analysis.chunks.filter(f => f.type === 'js').sort((a, b) => b.size - a.size);
  if (jsChunks.length > 0) {
    console.log(`\n📦 JavaScript 文件 (${jsChunks.length}个):`);
    jsChunks.slice(0, 10).forEach(chunk => {
      const compression = ((1 - chunk.gzippedSize / chunk.size) * 100).toFixed(1);
      console.log(`  ${chunk.name}: ${formatSize(chunk.size)} → ${formatSize(chunk.gzippedSize)} (${compression}%)`);
    });
    
    if (jsChunks.length > 10) {
      console.log(`  ... 还有 ${jsChunks.length - 10} 个文件`);
    }
  }
  
  // CSS文件分析
  const cssChunks = analysis.chunks.filter(f => f.type === 'css').sort((a, b) => b.size - a.size);
  if (cssChunks.length > 0) {
    console.log(`\n🎨 CSS 文件 (${cssChunks.length}个):`);
    cssChunks.forEach(chunk => {
      const compression = ((1 - chunk.gzippedSize / chunk.size) * 100).toFixed(1);
      console.log(`  ${chunk.name}: ${formatSize(chunk.size)} → ${formatSize(chunk.gzippedSize)} (${compression}%)`);
    });
  }
  
  // 静态资源分析
  const imageAssets = analysis.assets.filter(f => f.type === 'image').sort((a, b) => b.size - a.size);
  if (imageAssets.length > 0) {
    console.log(`\n🖼️  图片资源 (${imageAssets.length}个):`);
    imageAssets.slice(0, 5).forEach(asset => {
      console.log(`  ${asset.name}: ${formatSize(asset.size)}`);
    });
    
    if (imageAssets.length > 5) {
      console.log(`  ... 还有 ${imageAssets.length - 5} 个图片`);
    }
  }
  
  // 生成建议
  const recommendations = generateRecommendations(analysis);
  if (recommendations.length > 0) {
    console.log(`\n💡 优化建议:`);
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  // 性能评分
  const score = calculatePerformanceScore(analysis);
  console.log(`\n⭐ 性能评分: ${score}/100`);
  
  return analysis;
}

/**
 * 生成优化建议
 */
function generateRecommendations(analysis) {
  const recommendations = [];
  
  // JS文件大小检查
  const largeJsFiles = analysis.chunks.filter(f => f.type === 'js' && f.size > 500 * 1024);
  if (largeJsFiles.length > 0) {
    recommendations.push(`发现 ${largeJsFiles.length} 个大型JS文件(>500KB)，建议进一步代码分割`);
  }
  
  // CSS文件大小检查
  const largeCssFiles = analysis.chunks.filter(f => f.type === 'css' && f.size > 100 * 1024);
  if (largeCssFiles.length > 0) {
    recommendations.push(`发现 ${largeCssFiles.length} 个大型CSS文件(>100KB)，建议优化CSS或启用CSS分割`);
  }
  
  // 图片资源检查
  const largeImages = analysis.assets.filter(f => f.type === 'image' && f.size > 200 * 1024);
  if (largeImages.length > 0) {
    recommendations.push(`发现 ${largeImages.length} 个大型图片(>200KB)，建议压缩或使用WebP格式`);
  }
  
  // 总体大小检查
  if (analysis.totalSize > 5 * 1024 * 1024) {
    recommendations.push('应用总体积较大(>5MB)，建议启用懒加载和动态导入');
  }
  
  // 压缩率检查
  const compressionRatio = analysis.gzippedSize / analysis.totalSize;
  if (compressionRatio > 0.7) {
    recommendations.push('压缩效果不佳，建议检查是否包含了不必要的库或资源');
  }
  
  // Chunk数量检查
  const jsChunks = analysis.chunks.filter(f => f.type === 'js');
  if (jsChunks.length > 20) {
    recommendations.push('JS文件数量过多，可能影响HTTP/1.1性能，建议合并部分小文件');
  } else if (jsChunks.length < 5) {
    recommendations.push('JS文件数量较少，可以考虑进一步代码分割以优化缓存');
  }
  
  // 如果没有发现问题
  if (recommendations.length === 0) {
    recommendations.push('构建配置良好，无明显优化点！');
  }
  
  return recommendations;
}

/**
 * 计算性能评分
 */
function calculatePerformanceScore(analysis) {
  let score = 100;
  
  // 总体积扣分
  const totalSizeMB = analysis.totalSize / (1024 * 1024);
  if (totalSizeMB > 10) score -= 30;
  else if (totalSizeMB > 5) score -= 20;
  else if (totalSizeMB > 3) score -= 10;
  else if (totalSizeMB > 1) score -= 5;
  
  // 压缩率扣分
  const compressionRatio = analysis.gzippedSize / analysis.totalSize;
  if (compressionRatio > 0.8) score -= 15;
  else if (compressionRatio > 0.7) score -= 10;
  else if (compressionRatio > 0.6) score -= 5;
  
  // 大文件扣分
  const largeFiles = analysis.chunks.filter(f => f.size > 500 * 1024);
  score -= largeFiles.length * 5;
  
  // 文件数量
  const jsChunks = analysis.chunks.filter(f => f.type === 'js');
  if (jsChunks.length > 30) score -= 10;
  else if (jsChunks.length < 3) score -= 5;
  
  return Math.max(0, score);
}

/**
 * 生成详细的性能报告JSON
 */
function generateDetailedReport(analysis) {
  const reportPath = path.join(process.cwd(), 'dist', 'performance-report.json');
  
  const detailedReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSize: analysis.totalSize,
      gzippedSize: analysis.gzippedSize,
      compressionRatio: analysis.gzippedSize / analysis.totalSize,
      fileCount: analysis.chunks.length + analysis.assets.length,
      score: calculatePerformanceScore(analysis)
    },
    files: {
      javascript: analysis.chunks.filter(f => f.type === 'js'),
      css: analysis.chunks.filter(f => f.type === 'css'),
      images: analysis.assets.filter(f => f.type === 'image'),
      other: analysis.assets.filter(f => f.type !== 'image')
    },
    recommendations: generateRecommendations(analysis),
    performance: {
      largeFiles: analysis.chunks.filter(f => f.size > 500 * 1024),
      totalJsSize: analysis.chunks.filter(f => f.type === 'js').reduce((sum, f) => sum + f.size, 0),
      totalCssSize: analysis.chunks.filter(f => f.type === 'css').reduce((sum, f) => sum + f.size, 0),
      totalImageSize: analysis.assets.filter(f => f.type === 'image').reduce((sum, f) => sum + f.size, 0)
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  
  return detailedReport;
}

/**
 * 主函数
 */
function main() {
  try {
    const analysis = analyzeBuildOutput();
    generateReport(analysis);
    generateDetailedReport(analysis);
    
    console.log('\n✅ 性能分析完成！');
    
    // 如果有严重的性能问题，退出码为1
    const score = calculatePerformanceScore(analysis);
    if (score < 60) {
      console.log('\n⚠️  性能评分较低，建议优化后再发布');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 性能分析失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  analyzeBuildOutput,
  generateReport,
  generateRecommendations,
  calculatePerformanceScore
};