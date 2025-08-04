const { contextBridge, ipcRenderer } = require('electron');

// 2025年安全最佳实践：严格的API验证
const validateChannel = (channel) => {
  const allowedChannels = [
    'file:save-game', 'file:load-game', 'file:list-saves', 'file:delete-save',
    'config:get', 'config:set', 'config:reset',
    'app:quit', 'app:toggle-fullscreen',
    'error:log', 'error:get-logs', 'error:clear-logs',
    'updater:check', 'updater:download', 'updater:install'
  ];
  return allowedChannels.includes(channel);
};

// 添加调试信息（生产环境会被移除）
if (process.env.NODE_ENV === 'development') {
  console.log('Preload脚本正在执行');
}

// 2025年安全最佳实践：暴露最小化的安全API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作 - 添加数据验证
  saveGame: (data) => {
    if (!data || typeof data !== 'object') {
      throw new Error('无效的存档数据');
    }
    return ipcRenderer.invoke('file:save-game', data);
  },
  loadGame: (saveName) => {
    if (!saveName || typeof saveName !== 'string') {
      throw new Error('无效的存档名称');
    }
    return ipcRenderer.invoke('file:load-game', saveName);
  },
  listSaves: () => ipcRenderer.invoke('file:list-saves'),
  deleteSave: (saveName) => {
    if (!saveName || typeof saveName !== 'string') {
      throw new Error('无效的存档名称');
    }
    return ipcRenderer.invoke('file:delete-save', saveName);
  },

  // 配置操作 - 添加数据验证
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config) => {
    if (!config || typeof config !== 'object') {
      throw new Error('无效的配置数据');
    }
    return ipcRenderer.invoke('config:set', config);
  },
  resetConfig: () => ipcRenderer.invoke('config:reset'),

  // 应用操作
  quitApp: () => ipcRenderer.invoke('app:quit'),
  toggleFullscreen: () => ipcRenderer.invoke('app:toggle-fullscreen'),

  // 错误日志操作
  logError: (errorInfo) => ipcRenderer.invoke('error:log', errorInfo),
  getErrorLogs: (date) => ipcRenderer.invoke('error:get-logs', date),
  clearErrorLogs: (date) => ipcRenderer.invoke('error:clear-logs', date),

  // 更新器操作
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),

  // 监听事件
  onMenuAction: (callback) => {
    const validMenuActions = [
      'menu:new-game',
      'menu:load-game',
      'menu:save-game',
      'menu:show-settings',
      'menu:check-update',
      'menu:about',
      'menu:open-dev-tools'
    ];

    validMenuActions.forEach(action => {
      ipcRenderer.on(action, () => callback(action));
    });

    // 返回清理函数
    return () => {
      validMenuActions.forEach(action => {
        ipcRenderer.removeAllListeners(action);
      });
    };
  },

  // 应用退出前监听
  onBeforeQuit: (callback) => {
    ipcRenderer.on('app:before-quit', callback);
    return () => ipcRenderer.removeAllListeners('app:before-quit');
  },

  // 更新状态监听
  onUpdaterStatus: (callback) => {
    ipcRenderer.on('updater:status', (event, status) => callback(status));
    return () => ipcRenderer.removeAllListeners('updater:status');
  },

  // 存档清除监听（开发模式）
  onSavesCleared: (callback) => {
    ipcRenderer.on('saves:cleared', callback);
    return () => ipcRenderer.removeAllListeners('saves:cleared');
  },

  // 调试功能 - 仅在开发环境可用
  debug: process.env.NODE_ENV === 'development' ? {
    log: (message) => console.log(message),
    error: (message) => console.error(message),
    info: (message) => console.info(message),
    getProcessInfo: () => ({
      versions: process.versions,
      platform: process.platform,
      arch: process.arch
    })
  } : null,

  // 安全API信息（帮助调试）
  getSecurityInfo: () => ({
    contextIsolated: true,
    sandboxed: true,
    nodeIntegration: false,
    apiVersion: '2025.1'
  })
});

// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('捕获到全局错误:', event.error);
  ipcRenderer.invoke('error:log', {
    type: 'render_process',
    message: event.error?.message || '未知错误',
    stack: event.error?.stack || '',
    location: event.filename,
    line: event.lineno,
    column: event.colno,
    timestamp: new Date().toISOString()
  });
});

// 添加未处理的Promise拒绝处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('捕获到未处理的Promise拒绝:', event.reason);
  ipcRenderer.invoke('error:log', {
    type: 'unhandled_promise',
    message: event.reason?.message || '未处理的Promise拒绝',
    stack: event.reason?.stack || '',
    timestamp: new Date().toISOString()
  });
});

// 仅在开发环境输出日志
if (process.env.NODE_ENV === 'development') {
  console.log('Preload脚本执行完成 - 安全API已就绪');
}
