const { contextBridge, ipcRenderer } = require('electron');

// 添加调试信息
console.log('Preload脚本正在执行');

// 暴露给渲染进程的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  saveGame: (data) => ipcRenderer.invoke('file:save-game', data),
  loadGame: (saveName) => ipcRenderer.invoke('file:load-game', saveName),
  listSaves: () => ipcRenderer.invoke('file:list-saves'),
  deleteSave: (saveName) => ipcRenderer.invoke('file:delete-save', saveName),
  
  // 配置操作
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config) => ipcRenderer.invoke('config:set', config),
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
      'menu:about'
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
  
  // 调试功能
  debug: {
    log: (message) => console.log(message),
    error: (message) => console.error(message),
    info: (message) => console.info(message),
    getProcessInfo: () => ({
      versions: process.versions,
      platform: process.platform,
      arch: process.arch
    })
  }
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

console.log('Preload脚本执行完成'); 