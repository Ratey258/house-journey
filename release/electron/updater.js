const { app, ipcMain, dialog, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path'); // Added missing import for path

// 配置日志
log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/updater.log');
autoUpdater.logger = log;

/**
 * 设置自动更新
 * @param {BrowserWindow} mainWindow - 主窗口
 */
function setupAutoUpdater(mainWindow) {
  // 检查更新开始
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow(mainWindow, 'checking-for-update');
  });
  
  // 发现新版本
  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow(mainWindow, 'update-available', info);
    
    // 询问用户是否下载
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${info.version}，是否下载更新？`,
      buttons: ['是', '否'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });
  
  // 没有发现新版本
  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow(mainWindow, 'update-not-available', info);
  });
  
  // 更新下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    sendStatusToWindow(mainWindow, 'download-progress', progressObj);
  });
  
  // 更新下载完成
  autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow(mainWindow, 'update-downloaded', info);
    
    // 询问用户是否立即安装
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '更新已下载',
      message: '更新已下载完成，是否现在安装并重启应用？',
      buttons: ['是', '否'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });
  
  // 更新错误
  autoUpdater.on('error', (err) => {
    sendStatusToWindow(mainWindow, 'error', err);
    log.error('Update error:', err);
  });
  
  // 设置IPC处理器
  setupUpdaterIpc(mainWindow);
  
  // 自动检查更新（启动后延迟10秒）
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 10000);
}

/**
 * 设置更新器IPC通信
 * @param {BrowserWindow} mainWindow - 主窗口
 */
function setupUpdaterIpc(mainWindow) {
  // 检查更新
  ipcMain.handle('updater:check', async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('Check for updates failed:', error);
      return { error: error.message };
    }
  });
  
  // 下载更新
  ipcMain.handle('updater:download', async () => {
    try {
      return await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('Download update failed:', error);
      return { error: error.message };
    }
  });
  
  // 安装更新
  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  });
}

/**
 * 向渲染进程发送更新状态
 * @param {BrowserWindow} window - 主窗口
 * @param {string} status - 状态
 * @param {Object} data - 数据
 */
function sendStatusToWindow(window, status, data = {}) {
  if (window && !window.isDestroyed()) {
    window.webContents.send('updater:status', { status, data });
  }
}

module.exports = {
  setupAutoUpdater
}; 