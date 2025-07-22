const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { setupAutoUpdater } = require('./updater');

// 全局变量
let mainWindow = null;
let splashScreen = null;

// 解析命令行参数
const argv = process.argv.slice(1);
const hashArg = argv.find(arg => arg.startsWith('--hash='));
const initialHash = hashArg ? hashArg.replace('--hash=', '') : '';

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

// 获取应用程序根路径
function getAppPath() {
  // 判断是否是打包后的应用
  const isPackaged = app.isPackaged;

  // 打包后的应用，资源路径会有所不同
  if (isPackaged) {
    // 对于electron-packager打包的应用，资源在resources/app目录下
    // 对于electron-builder打包的应用，资源在resources/app.asar目录下
    const resourcesPath = path.join(process.resourcesPath);
    console.log('应用资源路径:', resourcesPath);
    return resourcesPath;
  } else {
    // 开发环境，使用项目根目录
    return path.join(__dirname, '..');
  }
}

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
  const splashPath = path.join(getAppPath(), 'resources/splash.html');
  console.log('加载启动画面:', splashPath);
  splashScreen.loadFile(splashPath);

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
    title: '买房记v0.1.0',
    show: false, // 先不显示主窗口
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true, // 确保开启Web安全
      // 开发环境使用更宽松的CSP
      contentSecurityPolicy: !app.isPackaged
        ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss: http: https:;"
        : "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';",
      webviewTag: false,
      sandbox: true,
      allowRunningInsecureContent: false
    },
    icon: path.join(getAppPath(), 'icon.ico')
  });

  // 设置Content-Security-Policy头
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    // 判断是否为开发环境
    const isDev = !app.isPackaged;

    // 为开发环境设置更宽松的CSP
    const csp = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss: http: https:;"
      : "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  // 根据环境加载应用
  if (app.isPackaged) {
    // 生产环境：加载打包后的index.html
    const indexPath = path.join(getAppPath(), 'dist/index.html');
    console.log('加载应用主页面:', indexPath);
    mainWindow.loadFile(indexPath);
  } else {
    // 开发环境：连接到Vite开发服务器
    // 尝试多个可能的端口
    const tryLoadDevServer = async () => {
      const ports = [5174, 5175, 5173]; // 按优先级排序的端口
      let loaded = false;

      for (const port of ports) {
        if (loaded) break;

        try {
          console.log(`尝试连接到开发服务器端口: ${port}`);
          // 设置超时，避免长时间等待
          const url = `http://127.0.0.1:${port}${initialHash ? '#' + initialHash : ''}`;
          console.log(`加载URL: ${url}`);
          const loadPromise = mainWindow.loadURL(url);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('连接超时')), 2000)
          );

          await Promise.race([loadPromise, timeoutPromise]);
          console.log(`成功连接到端口 ${port}`);
          loaded = true;
          break;
        } catch (err) {
          console.log(`连接到端口 ${port} 失败: ${err.message}`);
        }
      }

      if (!loaded) {
        console.log('无法连接到任何开发服务器端口，尝试加载本地文件');
        try {
          mainWindow.loadFile(path.join(__dirname, '../index.html'));
        } catch (err) {
          console.error('加载本地文件失败:', err);
        }
      }
    };

    tryLoadDevServer();

    // 如果连接失败，尝试加载本地文件
    mainWindow.webContents.on('did-fail-load', () => {
      console.log('无法连接到开发服务器，尝试加载本地文件');
      try {
        mainWindow.loadFile(path.join(__dirname, '../index.html'));
      } catch (err) {
        console.error('加载本地文件失败:', err);
      }
    });

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

  // 添加错误处理
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription);

    // 尝试重新加载
    if (app.isPackaged) {
      setTimeout(() => {
        const indexPath = path.join(getAppPath(), 'dist/index.html');
        console.log('尝试重新加载页面:', indexPath);
        mainWindow.loadFile(indexPath);
      }, 1000);
    }
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
        { label: '游戏开发工具', click: () => mainWindow.webContents.send('menu:open-dev-tools') },
        { label: '清除存档', click: () => clearAllSaves() }
      ]
    });
  } else {
    // 在生产环境也添加开发者工具，方便调试
    template.push({
      label: '开发',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '游戏开发工具', click: () => mainWindow.webContents.send('menu:open-dev-tools') }
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
