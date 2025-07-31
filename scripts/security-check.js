/**
 * 安全检查脚本
 * 用于检查项目中的常见安全问题
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 安全检查项目
const securityChecks = {
  // 依赖安全检查
  checkDependencies: function() {
    console.log('检查依赖安全性...');
    try {
      // 执行npm audit命令
      const result = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(result);

      if (auditData.metadata.vulnerabilities.total > 0) {
        console.log('\x1b[33m%s\x1b[0m', `发现 ${auditData.metadata.vulnerabilities.total} 个依赖安全问题:`);
        console.log(`高危: ${auditData.metadata.vulnerabilities.high || 0}`);
        console.log(`中危: ${auditData.metadata.vulnerabilities.moderate || 0}`);
        console.log(`低危: ${auditData.metadata.vulnerabilities.low || 0}`);
        console.log('\x1b[33m%s\x1b[0m', '建议运行 npm audit fix 修复问题');
      } else {
        console.log('\x1b[32m%s\x1b[0m', '未发现依赖安全问题');
      }
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '执行依赖安全检查时出错:', error.message);
    }
  },

  // 检查CSP配置
  checkCSP: function() {
    console.log('检查CSP策略配置...');
    const mainJsPath = path.join(__dirname, '../electron/main.js');

    try {
      const content = fs.readFileSync(mainJsPath, 'utf8');
      if (content.includes('unsafe-inline') && !content.includes('isDevelopment')) {
        console.log('\x1b[31m%s\x1b[0m', '警告: CSP配置中包含unsafe-inline，但没有环境区分');
      } else if (content.includes('unsafe-eval') && !content.includes('isDevelopment')) {
        console.log('\x1b[31m%s\x1b[0m', '警告: CSP配置中包含unsafe-eval，但没有环境区分');
      } else {
        console.log('\x1b[32m%s\x1b[0m', 'CSP配置检查通过');
      }
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '检查CSP配置时出错:', error.message);
    }
  },

  // 检查IPC调用安全
  checkIPC: function() {
    console.log('检查IPC通信安全...');
    const preloadPath = path.join(__dirname, '../electron/preload.js');

    try {
      const content = fs.readFileSync(preloadPath, 'utf8');
      if (!content.includes('contextIsolation: true') && !content.includes('contextBridge')) {
        console.log('\x1b[31m%s\x1b[0m', '警告: 未正确使用contextIsolation和contextBridge');
      } else {
        console.log('\x1b[32m%s\x1b[0m', 'IPC安全配置检查通过');
      }
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '检查IPC安全配置时出错:', error.message);
    }
  },

  // 检查是否存在硬编码的敏感信息
  checkHardcodedSecrets: function() {
    console.log('检查硬编码敏感信息...');
    const patterns = [
      'password',
      'secret',
      'api_key',
      'apikey',
      'token',
      'auth',
      'credentials'
    ];

    const excludeDirs = ['node_modules', 'dist', '.git', 'build-output'];
    const sourceDir = path.join(__dirname, '..');

    let foundSecrets = false;

    function scanFile(filePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        for (const pattern of patterns) {
          const regex = new RegExp(`['"]?${pattern}['"]?\\s*[=:]\\s*['"]([^'"]+)['"]`, 'gi');
          const matches = content.match(regex);
          if (matches) {
            console.log('\x1b[33m%s\x1b[0m', `可能的硬编码敏感信息在 ${path.relative(sourceDir, filePath)}`);
            foundSecrets = true;
            break;
          }
        }
      } catch (error) {
        // 忽略二进制文件等读取错误
      }
    }

    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            scanDir(fullPath);
          }
        } else if (entry.isFile() &&
                 (fullPath.endsWith('.js') || fullPath.endsWith('.vue') ||
                  fullPath.endsWith('.json') || fullPath.endsWith('.ts'))) {
          scanFile(fullPath);
        }
      }
    }

    try {
      scanDir(sourceDir);
      if (!foundSecrets) {
        console.log('\x1b[32m%s\x1b[0m', '未发现明显的硬编码敏感信息');
      }
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '检查硬编码敏感信息时出错:', error.message);
    }
  }
};

// 执行所有安全检查
console.log('\x1b[36m%s\x1b[0m', '开始执行安全检查...');
Object.values(securityChecks).forEach(check => check());
console.log('\x1b[36m%s\x1b[0m', '安全检查完成');
