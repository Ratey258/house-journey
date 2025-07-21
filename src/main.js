import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import i18n from './i18n';
import { 
  loadErrorLogs, 
  setupGlobalErrorHandlers, 
  checkGameAbnormalExit,
  markGameRunning,
  clearGameRunningMark,
  handleError,
  ErrorType,
  ErrorSeverity
} from './infrastructure/utils/errorHandler';
import { initSnapshotSystem } from './infrastructure/persistence/stateSnapshot';
import { createStateLogger } from './infrastructure/utils';
// 导入第三方库配置
import { setupThirdParty } from './plugins/thirdParty';

// 导入视图
import MainMenu from './ui/views/MainMenu.vue';
import GameView from './ui/views/GameView.vue';
import SettingsView from './ui/views/SettingsView.vue';
import SavesView from './ui/views/SavesView.vue';
import DevToolsView from './ui/views/DevToolsView.vue';
import GameOverView from './ui/views/GameOverView.vue';
import LoadingTest from './ui/views/LoadingTest.vue'; // 导入测试页面

// 添加调试信息
console.log('应用初始化开始');

// 加载保存的错误日志
loadErrorLogs();

// 创建路由
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: MainMenu },
    { path: '/game', component: GameView },
    { path: '/settings', component: SettingsView },
    { path: '/saves', component: SavesView },
    { path: '/dev-tools', component: DevToolsView },
    { path: '/game-over', component: GameOverView },
    { path: '/loading-test', component: LoadingTest } // 添加测试页面路由
  ]
});

console.log('路由初始化完成');

// 创建Pinia状态管理
const pinia = createPinia();

// 创建Vue应用
const app = createApp(App);

// 注册插件 - 确保Pinia先注册
app.use(pinia);
app.use(router);
app.use(i18n);

console.log('插件注册完成');

// 设置第三方库
setupThirdParty(app);

// 设置全局错误处理
setupGlobalErrorHandlers(app);

console.log('第三方库和错误处理设置完成');

// 预初始化Pinia存储，确保在应用挂载前已经准备好
(async function initializePinia() {
  try {
    // 预加载关键存储
    const { useUiStore } = await import('./stores/uiStore');
    const { useGameCoreStore, useGameProgressStore } = await import('./stores/gameCore');
    const { useSettingsStore } = await import('./stores/settingsStore');
    const { useMarketStore, usePriceSystemStore } = await import('./stores/market');
    const { usePlayerStore } = await import('./stores/player');
    const { useGameStore } = await import('./stores');
    
    // 初始化存储
    const uiStore = useUiStore();
    const gameCoreStore = useGameCoreStore();
    const settingsStore = useSettingsStore();
    
    console.log('Pinia存储预初始化完成:', {
      uiStore: !!uiStore,
      gameCoreStore: !!gameCoreStore,
      settingsStore: !!settingsStore
    });
    
    // 在开发环境中应用状态日志中间件
    if (process.env.NODE_ENV === 'development') {
      console.log('应用状态日志中间件');
      
      // 为核心Store应用日志中间件
      const gameStore = useGameStore();
      const gameCore = useGameCoreStore();
      const gameProgress = useGameProgressStore();
      const player = usePlayerStore();
      const market = useMarketStore();
      const priceSystem = usePriceSystemStore();
      
      // 配置日志选项
      const logOptions = {
        collapsed: true,
        logActions: true,
        logMutations: true
      };
      
      // 应用日志中间件
      createStateLogger(gameStore, { 
        ...logOptions, 
        actionNameFilter: name => ['buyProduct', 'sellProduct', 'advanceWeek'].includes(name) 
      });
      createStateLogger(gameCore, logOptions);
      createStateLogger(gameProgress, logOptions);
      createStateLogger(player, logOptions);
      createStateLogger(market, logOptions);
      createStateLogger(priceSystem, { ...logOptions, logMutations: false }); // 价格系统变化频繁，只记录操作
      
      console.log('状态日志中间件应用完成');
    }
    
    // 验证关键资源
    validateCriticalResources();
  } catch (error) {
    handleError(error, 'main.pinitaInit', ErrorType.SYSTEM, ErrorSeverity.ERROR);
    console.error('Pinia存储预初始化失败:', error);
  }
})();

// 验证关键资源是否可访问
function validateCriticalResources() {
  try {
    console.log('开始验证关键资源...');
    
    // 验证彩蛋事件图片
    const easterEggImagePaths = [
      './resources/assets/images/events/special_encounter.jpg'
    ];
    
    // 记录资源状态
    const resourceStatus = {};
    
    // 检查图片资源
    easterEggImagePaths.forEach(path => {
      console.log(`检查资源: ${path}`);
      const img = new Image();
      
      img.onload = () => {
        console.log(`✅ 资源加载成功: ${path}`);
        resourceStatus[path] = 'loaded';
      };
      
      img.onerror = (err) => {
        console.error(`❌ 资源加载失败: ${path}`, err);
        resourceStatus[path] = 'failed';
        
        // 尝试其他可能的路径
        const altPaths = [
          path,
          path.replace('./resources', ''),
          path.replace('./resources', '.'),
          `/resources${path.substring(1)}`
        ];
        
        console.log(`尝试替代路径:`, altPaths);
      };
      
      img.src = path;
    });
  } catch (error) {
    console.error('验证资源时出错:', error);
  }
}

// 检查是否异常退出
(async function checkForAbnormalExit() {
  try {
    const wasAbnormalExit = checkGameAbnormalExit();
    
    if (wasAbnormalExit) {
      console.info('检测到异常退出，准备恢复');
      
      try {
        // 导入需要的存储
        const uiStoreModule = await import('./stores/uiStore');
        const gameStoreModule = await import('./stores/gameCore');
        
        // 初始化快照系统
        await initSnapshotSystem();
        
        // 获取存储实例
        const uiStore = uiStoreModule.useUiStore();
        const gameStore = gameStoreModule.useGameCoreStore();
        
        if (!uiStore || !gameStore) {
          throw new Error('无法获取存储实例');
        }
        
        // 等待DOM加载完成
        setTimeout(async () => {
          try {
            // 使用动态导入获取快照功能
            const stateSnapshotModule = await import('./infrastructure/persistence/stateSnapshot');
            const { loadLatestSnapshot, applySnapshot } = stateSnapshotModule;
            
            const snapshot = await loadLatestSnapshot();
            if (snapshot) {
              uiStore.showRecoveryDialog({
                snapshot,
                message: '检测到游戏异常退出。是否恢复上次的游戏状态？',
                title: '游戏恢复',
                allowCancel: true,
                onRecover: async () => {
                  try {
                    const success = await applySnapshot(gameStore, snapshot);
                    if (success) {
                      uiStore.showToast({
                        type: 'success',
                        message: '游戏状态已成功恢复'
                      });
                      
                      // 如果不在游戏页面，跳转到游戏页面
                      if (router.currentRoute.value.path !== '/game') {
                        router.push('/game');
                      }
                    }
                  } catch (error) {
                    handleError(error, 'main.applySnapshot', ErrorType.STORAGE, ErrorSeverity.ERROR);
                    console.error('恢复游戏状态时出错:', error);
                    uiStore.showToast({
                      type: 'error',
                      message: '恢复游戏状态失败'
                    });
                  }
                },
                onCancel: () => {
                  console.log('用户取消了恢复操作');
                }
              });
            }
          } catch (err) {
            handleError(err, 'main.loadSnapshot', ErrorType.STORAGE, ErrorSeverity.ERROR);
            console.error('加载快照时出错:', err);
          }
        }, 1000);
      } catch (error) {
        handleError(error, 'main.initRecovery', ErrorType.SYSTEM, ErrorSeverity.ERROR);
        console.error('准备恢复游戏状态时出错:', error);
      }
    }
  } catch (error) {
    handleError(error, 'main.checkAbnormalExit', ErrorType.SYSTEM, ErrorSeverity.ERROR);
    console.error('检查异常退出时出错:', error);
  }
})();

// 标记游戏已启动
markGameRunning();

// 注册页面卸载事件
window.addEventListener('beforeunload', () => {
  clearGameRunningMark();
});

// 定期更新活动状态
setInterval(() => {
  markGameRunning();
}, 60000); // 每分钟更新一次

// 确保DOM已加载后再挂载应用
let appMounted = false;

function mountApp() {
  if (appMounted) return;
  
  try {
    // 检查挂载点是否存在
    const appElement = document.getElementById('app');
    if (appElement) {
      console.log('找到挂载点，挂载应用');
      // 挂载应用
      app.mount('#app');
      appMounted = true;
      console.log('应用挂载完成');
      
      // 触发应用加载完成事件
      window.dispatchEvent(new Event('app-loaded'));
    } else {
      console.error('找不到挂载点 #app');
    }
  } catch (error) {
    handleError(error, 'main.mountApp', ErrorType.SYSTEM, ErrorSeverity.FATAL);
    console.error('应用挂载失败:', error);
  }
}

// DOM加载完成后挂载
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM已加载，准备挂载应用');
  mountApp();
});

// 备用挂载方法，确保应用一定会被挂载
setTimeout(() => {
  if (!appMounted) {
    console.log('使用备用方法挂载应用');
    mountApp();
  }
}, 1000); 