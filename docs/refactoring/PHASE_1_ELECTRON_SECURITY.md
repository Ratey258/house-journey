# 重构阶段1：Electron安全升级详细指南

## 🎯 阶段目标

将Electron从29.1.0升级到35.x，并加强安全配置，符合2025年安全标准。

## 📋 当前状态分析

### 现有配置评估 (electron/main.cjs)
```javascript
// ✅ 已有良好配置
webPreferences: {
  contextIsolation: true,        // ✓ 已启用
  nodeIntegration: false,        // ✓ 已禁用
  webSecurity: true,            // ✓ 已启用
  sandbox: true,                // ✓ 已启用沙盒
  contentSecurityPolicy: "...", // ✓ 已配置CSP
}

// ⚠️ 需要改进的配置
webSecurity: true,              // 可进一步加强
allowRunningInsecureContent: false, // 已设置，但可优化
```

### 安全风险评估
- **中等风险**: Electron版本较旧，存在已修复的安全漏洞
- **低风险**: 基础安全配置已到位
- **改进空间**: 可启用更多安全特性

## 🚀 升级步骤

### 步骤1: 升级Electron版本

```bash
# 1. 备份当前配置
cp electron/main.cjs electron/main.cjs.backup

# 2. 升级Electron
npm install electron@^35.0.0 --save-dev

# 3. 升级相关依赖
npm install electron-builder@^25.0.0 --save-dev
npm install concurrently@^9.0.0 --save-dev
```

### 步骤2: 更新主进程安全配置

```javascript
// electron/main.cjs - 新增安全特性
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');

// 2025年安全最佳实践
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

// 禁用不安全的功能
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('no-sandbox'); // 仅在必要时使用

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: `买房记 v${pkg.version}`,
    show: false,
    webPreferences: {
      // 核心安全配置
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: true,
      
      // 新增安全特性
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      disableBlinkFeatures: 'Auxclick',
      webviewTag: false,
      navigateOnDragDrop: false,
      spellcheck: false,
      v8CacheOptions: 'none',
      
      // 权限策略
      permissions: ['notifications', 'persistent-storage'],
      
      // CSP强化
      contentSecurityPolicy: isDevelopment
        ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws: wss:;"
        : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    }
  });
}
```

### 步骤3: 强化预加载脚本安全

```javascript
// electron/preload.cjs - 安全API暴露
const { contextBridge, ipcRenderer } = require('electron');

// 定义允许的IPC通道白名单
const ALLOWED_CHANNELS = {
  // 游戏数据相关
  'file:save-game': true,
  'file:load-game': true,
  'file:list-saves': true,
  'file:delete-save': true,
  
  // 配置相关
  'config:get': true,
  'config:set': true,
  
  // 应用控制
  'app:quit': true,
  'app:toggle-fullscreen': true,
  
  // 错误日志
  'error:log': true
};

// 安全的IPC调用包装器
const secureInvoke = (channel, ...args) => {
  if (!ALLOWED_CHANNELS[channel]) {
    throw new Error(`IPC channel '${channel}' not allowed`);
  }
  return ipcRenderer.invoke(channel, ...args);
};

// 类型安全的API暴露
contextBridge.exposeInMainWorld('electronAPI', {
  // 游戏状态操作
  saveGame: (data) => {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid save data');
    }
    return secureInvoke('file:save-game', data);
  },
  
  loadGame: (saveName) => {
    if (!saveName || typeof saveName !== 'string') {
      throw new Error('Invalid save name');
    }
    return secureInvoke('file:load-game', saveName);
  },
  
  listSaves: () => secureInvoke('file:list-saves'),
  
  deleteSave: (saveName) => {
    if (!saveName || typeof saveName !== 'string') {
      throw new Error('Invalid save name');
    }
    return secureInvoke('file:delete-save', saveName);
  },
  
  // 配置操作
  getConfig: () => secureInvoke('config:get'),
  setConfig: (config) => {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid config data');
    }
    return secureInvoke('config:set', config);
  },
  
  // 应用控制
  quitApp: () => secureInvoke('app:quit'),
  toggleFullscreen: () => secureInvoke('app:toggle-fullscreen'),
  
  // 错误报告
  logError: (errorInfo) => {
    if (!errorInfo || typeof errorInfo !== 'object') {
      throw new Error('Invalid error info');
    }
    return secureInvoke('error:log', errorInfo);
  },
  
  // 获取应用信息
  getAppVersion: () => process.env.npm_package_version || '0.1.4'
});

// 安全事件监听
window.addEventListener('DOMContentLoaded', () => {
  // 禁用右键菜单（生产环境）
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // 禁用F12等调试快捷键（生产环境）
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
      }
    });
  }
});
```

### 步骤4: 更新构建配置

```javascript
// electron-builder.js - 安全构建配置
module.exports = {
  appId: 'com.housejourney.app',
  productName: '买房记',
  directories: {
    output: 'build-output'
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'package.json'
  ],
  win: {
    icon: 'resources/logo.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32']
      },
      {
        target: 'portable',
        arch: ['x64', 'ia32']
      }
    ],
    // 安全配置
    signAndEditExecutable: false,
    verifyUpdateCodeSignature: false,
    requestedExecutionLevel: 'asInvoker'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: '买房记',
    // 安全安装配置
    runAfterFinish: false,
    allowElevation: false
  },
  // 代码签名（如果有证书）
  certificateFile: process.env.CERT_FILE,
  certificatePassword: process.env.CERT_PASSWORD,
  
  // 自动更新安全配置
  publish: {
    provider: 'github',
    private: false,
    token: process.env.GITHUB_TOKEN
  }
};
```

## 📊 验证测试

### 安全测试清单

```bash
# 1. 安全审计
npm audit
npm audit fix

# 2. Electron安全检查
npx @doyensec/electronegativity .

# 3. 功能测试
npm run electron:dev  # 验证开发环境
npm run electron:build  # 验证构建
```

### 手动验证项目

- [ ] 应用正常启动
- [ ] 游戏功能完整
- [ ] 存档系统正常
- [ ] 无安全警告
- [ ] IPC通信正常
- [ ] 自动更新机制（如果启用）

## 🎯 预期收益

### 安全性提升
- 修复29.1.0到35.x之间的所有已知安全漏洞
- 加强IPC通信安全
- 更严格的沙盒限制
- 改进的CSP策略

### 性能改进
- Electron引擎性能优化
- 更好的内存管理
- 启动速度提升5-10%

### 兼容性
- 支持最新的Windows功能
- 更好的系统集成
- 改进的显示适配

## ⚠️ 风险控制

### 可能的问题
1. **API变更**: Electron 35可能有破坏性变更
2. **性能回归**: 新版本可能影响性能
3. **兼容性问题**: 与某些系统的兼容性

### 缓解措施
1. **渐进升级**: 先升级到32.x，再到35.x
2. **充分测试**: 在多个Windows版本上测试
3. **回滚准备**: 保持备份，确保可快速回滚

## 📅 时间规划

- **第1-2天**: 升级Electron版本，更新配置
- **第3-4天**: 安全配置优化，测试验证  
- **第5天**: 构建测试，文档更新

## 🎉 完成标准

- [ ] Electron成功升级到35.x
- [ ] 所有安全配置按最佳实践更新
- [ ] 通过安全审计工具检查
- [ ] 游戏功能完整可用
- [ ] 构建产物正常
- [ ] 文档已更新
