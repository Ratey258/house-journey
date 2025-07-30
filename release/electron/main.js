const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { setupAutoUpdater } = require('./updater');

// 全局变量
let mainWindow = null;
let splashScreen = null;

// 初始化配置存储
const store = new Store({
  name: 'house-journey-config',
  defaults: {
    gameSettings: {
      difficulty: 'standard',
      autoSaveInterval: 1,
      soundEnabled: true,
      fullScreen: false,
      textSpeed: 'normal'
    }
  }
});

// 创建启动画面
function createSplashScreen() {
  splashScreen = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 加载启动画面
  splashScreen.loadFile(path.join(__dirname, '../resources/splash.html'));

  // 启动画面不显示在任务栏
  splashScreen.setSkipTaskbar(true);

  // 居中显示
  splashScreen.center();
}

// 创建应用窗口
function createMainWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: '买房记 v0.1.1',
    show: false, // 先不显示主窗口
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../icon.ico')
  });

  // 根据环境加载应用
  if (app.isPackaged) {
    // 生产环境：加载打包后的index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // 开发环境：连接到Vite开发服务器
    mainWindow.loadURL('http://localhost:5173');
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  }

  // 当内容加载完成后
  mainWindow.webContents.on('did-finish-load', () => {
    // 关闭启动画面并显示主窗口
    if (splashScreen && !splashScreen.isDestroyed()) {
      splashScreen.close();
    }

    // 在300ms后显示主窗口（给一点时间让渲染进程准备好）
    setTimeout(() => {
      mainWindow.show();
      mainWindow.focus();

      // 检查是否应该全屏显示
      const { fullScreen } = store.get('gameSettings');
      if (fullScreen) {
        mainWindow.setFullScreen(true);
      }
    }, 300);
  });

  // 设置自动更新
  setupAutoUpdater(mainWindow);
}

// 创建应用菜单
function createAppMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '新游戏', click: () => mainWindow.webContents.send('menu:new-game') },
        { label: '载入游戏', click: () => mainWindow.webContents.send('menu:load-game') },
        { label: '保存游戏', click: () => mainWindow.webContents.send('menu:save-game') },
        { type: 'separator' },
        { label: '退出', click: () => app.quit() }
      ]
    },
    {
      label: '设置',
      submenu: [
        { label: '游戏设置', click: () => mainWindow.webContents.send('menu:show-settings') },
        {
          label: '全屏',
          type: 'checkbox',
          checked: store.get('gameSettings.fullScreen'),
          click: (menuItem) => {
            mainWindow.setFullScreen(menuItem.checked);
            store.set('gameSettings.fullScreen', menuItem.checked);
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '游戏官网',
          click: () => shell.openExternal('http://www.housejourney.com')
        },
        {
          label: '检查更新',
          click: () => mainWindow.webContents.send('menu:check-update')
        },
        { type: 'separator' },
        {
          label: '关于',
          click: () => mainWindow.webContents.send('menu:about')
        }
      ]
    }
  ];

  // 开发环境添加开发者工具
  if (!app.isPackaged) {
    template.push({
      label: '开发',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '清除存档', click: () => clearAllSaves() }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 应用准备就绪时
app.whenReady().then(() => {
  // 创建启动画面
  createSplashScreen();

  // 设置IPC通信处理器
  setupIpcHandlers();

  // 确保存档和日志目录存在
  ensureDirectoriesExist();

  // 稍微延迟创建主窗口，让启动画面有时间显示
  setTimeout(() => {
    createMainWindow();
    createAppMenu();
  }, 1000);

  app.on('activate', function () {
    // 在macOS上，当点击dock图标且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// 应用退出前
app.on('before-quit', () => {
  // 触发保存游戏事件
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app:before-quit');
  }
});

// 设置IPC通信处理器
function setupIpcHandlers() {
  // 文件操作
  ipcMain.handle('file:save-game', handleSaveGame);
  ipcMain.handle('file:load-game', handleLoadGame);
  ipcMain.handle('file:list-saves', handleListSaves);
  ipcMain.handle('file:delete-save', handleDeleteSave);

  // 配置操作
  ipcMain.handle('config:get', () => store.store);
  ipcMain.handle('config:set', (event, config) => {
    store.set(config);
    return store.store;
  });
  ipcMain.handle('config:reset', () => {
    store.clear();
    return store.store;
  });

  // 应用操作
  ipcMain.handle('app:quit', () => {
    app.quit();
  });
  ipcMain.handle('app:toggle-fullscreen', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const isFullScreen = window.isFullScreen();
    window.setFullScreen(!isFullScreen);
    store.set('gameSettings.fullScreen', !isFullScreen);
    return !isFullScreen;
  });

  // 错误日志操作
  ipcMain.handle('error:log', handleErrorLog);
  ipcMain.handle('error:get-logs', handleGetErrorLogs);
  ipcMain.handle('error:clear-logs', handleClearErrorLogs);
}

// 确保目录存在
function ensureDirectoriesExist() {
  // 存档目录
  const saveDir = path.join(app.getPath('userData'), 'saves');
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }

  // 日志目录
  const logDir = path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 缓存目录
  const cacheDir = path.join(app.getPath('userData'), 'cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // 用户数据目录
  const userDataDir = path.join(app.getPath('userData'), 'user_data');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
}

// 清除所有存档 (仅开发环境)
function clearAllSaves() {
  if (app.isPackaged) return;

  const saveDir = path.join(app.getPath('userData'), 'saves');
  if (fs.existsSync(saveDir)) {
    const files = fs.readdirSync(saveDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(saveDir, file));
      }
    }
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('saves:cleared');
  }
}

// 处理保存游戏请求
async function handleSaveGame(event, data) {
  try {
    const saveDir = path.join(app.getPath('userData'), 'saves');
    const filePath = path.join(saveDir, `${data.name}.json`);

    await fs.promises.writeFile(filePath, JSON.stringify(data.gameState, null, 2));
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Save game error:', error);
    return { success: false, error: error.message };
  }
}

// 处理加载游戏请求
async function handleLoadGame(event, saveName) {
  try {
    const filePath = path.join(app.getPath('userData'), 'saves', `${saveName}.json`);
    const data = await fs.promises.readFile(filePath, 'utf8');
    return { success: true, gameState: JSON.parse(data) };
  } catch (error) {
    console.error('Load game error:', error);
    return { success: false, error: error.message };
  }
}

// 处理列出存档请求
async function handleListSaves() {
  try {
    const saveDir = path.join(app.getPath('userData'), 'saves');

    // 确保目录存在
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
      return { success: true, saves: [] };
    }

    const files = await fs.promises.readdir(saveDir);
    const saves = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const name = file.replace('.json', '');
        const stats = fs.statSync(path.join(saveDir, file));
        return {
          name,
          lastModified: stats.mtime
        };
      })
      .sort((a, b) => b.lastModified - a.lastModified);

    return { success: true, saves };
  } catch (error) {
    console.error('List saves error:', error);
    return { success: false, error: error.message };
  }
}

// 处理删除存档请求
async function handleDeleteSave(event, saveName) {
  try {
    const filePath = path.join(app.getPath('userData'), 'saves', `${saveName}.json`);
    await fs.promises.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Delete save error:', error);
    return { success: false, error: error.message };
  }
}

// 处理错误日志请求
async function handleErrorLog(event, errorInfo) {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(logDir, `error-${today}.log`);

    // 格式化错误信息
    const logEntry = `[${new Date().toISOString()}] [${errorInfo.severity.toUpperCase()}] [${errorInfo.context}] ${errorInfo.message}\n`;

    // 追加到日志文件
    await fs.promises.appendFile(logFile, logEntry);

    // 对于严重错误，添加详细信息
    if (errorInfo.severity === 'fatal' || errorInfo.severity === 'error') {
      const detailsEntry = `Details: ${JSON.stringify(errorInfo, null, 2)}\nStack: ${errorInfo.stack || 'No stack trace'}\n\n`;
      await fs.promises.appendFile(logFile, detailsEntry);
    }

    return { success: true };
  } catch (error) {
    console.error('Error logging failed:', error);
    return { success: false, error: error.message };
  }
}

// 处理获取错误日志请求
async function handleGetErrorLogs(event, date) {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs');
    const targetDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(logDir, `error-${targetDate}.log`);

    if (!fs.existsSync(logFile)) {
      return { success: true, logs: [] };
    }

    const content = await fs.promises.readFile(logFile, 'utf8');
    const logs = content.split('\n\n')
      .filter(entry => entry.trim())
      .map(entry => {
        const lines = entry.split('\n');
        const header = lines[0];
        const details = lines.slice(1).join('\n');

        // 解析头部信息
        const timestampMatch = header.match(/\[(.*?)\]/);
        const severityMatch = header.match(/\[(fatal|error|warning|info)\]/i);
        const contextMatch = header.match(/\[([^\[\]]*)\][^\[]*$/);
        const messageMatch = header.match(/\][^\[]*\][^\[]*\]\s*(.*)/);

        return {
          timestamp: timestampMatch ? timestampMatch[1] : '',
          severity: severityMatch ? severityMatch[1].toLowerCase() : 'unknown',
          context: contextMatch ? contextMatch[1] : '',
          message: messageMatch ? messageMatch[1] : header,
          details: details
        };
      });

    return { success: true, logs };
  } catch (error) {
    console.error('Get error logs failed:', error);
    return { success: false, error: error.message };
  }
}

// 处理清除错误日志请求
async function handleClearErrorLogs(event, date) {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs');

    if (date) {
      // 清除特定日期的日志
      const logFile = path.join(logDir, `error-${date}.log`);
      if (fs.existsSync(logFile)) {
        await fs.promises.unlink(logFile);
      }
    } else {
      // 清除所有日志
      const files = await fs.promises.readdir(logDir);
      for (const file of files) {
        if (file.startsWith('error-') && file.endsWith('.log')) {
          await fs.promises.unlink(path.join(logDir, file));
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Clear error logs failed:', error);
    return { success: false, error: error.message };
  }
}
