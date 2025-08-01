/**
 * 应用主入口文件 - TypeScript版本
 * Vue 3 + TypeScript + Pinia 应用初始化
 */

import { createApp, type App as VueApp } from 'vue';
import { createPinia, type Pinia } from 'pinia';
import { createRouter, createWebHashHistory, type Router } from 'vue-router';
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
import { useSmartLogger } from './infrastructure/utils/smartLogger';
import { initSnapshotSystem } from './infrastructure/persistence/stateSnapshot';
// 导入第三方库配置
import { setupThirdParty } from './plugins/thirdParty';

// ==================== 类型定义 ====================

/**
 * 全局应用实例接口
 */
declare global {
  interface Window {
    electronAPI?: {
      onMenuAction?: (callback: (action: string) => void) => void;
    };
  }
}

/**
 * 菜单操作类型
 */
type MenuAction = 'menu:open-dev-tools' | string;

/**
 * 存储验证结果接口
 */
interface StoreValidationResult {
  uiStore: boolean;
  gameCoreStore: boolean;
  settingsStore: boolean;
}

// Vue 3.5 性能优化：视图懒加载
// 使用动态导入实现路由级代码分割
const MainMenu = () => import('./ui/views/MainMenu.vue');
const GameView = () => import('./ui/views/GameView.vue');
const SettingsView = () => import('./ui/views/SettingsView.vue');
const SavesView = () => import('./ui/views/SavesView.vue');
const DevToolsView = () => import('./ui/views/DevToolsView.vue');
const GameOverView = () => import('./ui/views/GameOverView.vue');
const LoadingTest = () => import('./ui/views/LoadingTest.vue');

// 初始化智能日志系统
const { game, ui } = useSmartLogger();

// 应用初始化开始
game.info('应用初始化开始', { timestamp: new Date().toISOString() }, 'app-init');

// 加载保存的错误日志
loadErrorLogs();

// ==================== 应用初始化 ====================

// 创建路由
const router: Router = createRouter({
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

game.info('路由初始化完成', { routes: router.getRoutes().length }, 'router-init');

// 创建Pinia状态管理
// Pinia 3.0 增强配置
const pinia: Pinia = createPinia();

// 开发环境启用Pinia DevTools集成
if (import.meta.env.DEV) {
  // Pinia 3.0 自动支持Vue DevTools
  // 无需额外配置，开发环境下自动启用状态追踪
}

// 创建Vue应用
const app: VueApp = createApp(App);

// 注册插件 - 确保Pinia先注册
app.use(pinia);
app.use(router);
app.use(i18n);

game.info('插件注册完成', { plugins: ['pinia', 'router', 'i18n'] }, 'plugins-registered');

// 设置第三方库
setupThirdParty(app);

// 设置全局错误处理
setupGlobalErrorHandlers(app);

game.info('第三方库和错误处理设置完成', {}, 'third-party-setup');

// ==================== Pinia存储初始化 ====================

// 预初始化Pinia存储，确保在应用挂载前已经准备好
(async function initializePinia(): Promise<void> {
  try {
    // 预加载关键存储
    const { useUiStore } = await import('./stores/uiStore');
    const { useGameCoreStore } = await import('./stores/gameCore');
    const { useSettingsStore } = await import('./stores/settingsStore');

    // 初始化存储
    const uiStore = useUiStore();
    const gameCoreStore = useGameCoreStore();
    const settingsStore = useSettingsStore();

    const validationResult: StoreValidationResult = {
      uiStore: !!uiStore,
      gameCoreStore: !!gameCoreStore,
      settingsStore: !!settingsStore
    };

    game.info('Pinia存储预初始化完成', validationResult, 'pinia-validation');

    // 验证关键资源
    validateCriticalResources();
  } catch (error) {
    handleError(error as Error, 'main.pinitaInit', ErrorType.SYSTEM, ErrorSeverity.ERROR);
    console.error('Pinia存储预初始化失败:', error);
  }
})();

// 验证关键资源是否可访问
function validateCriticalResources(): void {
  try {
    game.info('开始验证关键资源', {}, 'resource-validation-start');
    game.info('关键资源验证完成', {}, 'resource-validation-complete');
  } catch (error) {
    console.error('验证资源时出错:', error);
  }
}

// ==================== 异常退出恢复系统 ====================

// 检查是否异常退出
(async function checkForAbnormalExit(): Promise<void> {
  try {
    const wasAbnormalExit: boolean = checkGameAbnormalExit();

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
                  game.info('用户取消了恢复操作', {}, 'recovery-cancelled');
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

// ==================== 应用挂载系统 ====================

// 确保DOM已加载后再挂载应用
let appMounted: boolean = false;

function mountApp(): void {
  if (appMounted) return;

  try {
    // 检查挂载点是否存在
    const appElement: HTMLElement | null = document.getElementById('app');
    if (appElement) {
      ui.info('找到挂载点，挂载应用', { element: '#app' }, 'mount-app');
      // 挂载应用
      app.mount('#app');
      appMounted = true;
      ui.info('应用挂载完成', { mounted: true }, 'app-mounted');

      // 触发应用加载完成事件
      window.dispatchEvent(new Event('app-loaded'));

      // 监听Electron菜单事件
      if (window.electronAPI?.onMenuAction) {
        window.electronAPI.onMenuAction((action: MenuAction) => {
          game.debug('收到菜单事件', { action }, 'menu-action');

          // 处理各种菜单事件
          if (action === 'menu:open-dev-tools') {
            // 触发显示浮动开发工具窗口
            window.dispatchEvent(new CustomEvent('show-dev-tools'));
          }
        });
      }
    } else {
      console.error('找不到挂载点 #app');
    }
  } catch (error) {
    handleError(error as Error, 'main.mountApp', ErrorType.SYSTEM, ErrorSeverity.FATAL);
    console.error('应用挂载失败:', error);
  }
}

// DOM加载完成后挂载
document.addEventListener('DOMContentLoaded', () => {
  ui.info('DOM已加载，准备挂载应用', { readyState: document.readyState }, 'dom-ready');
  mountApp();
});

// 备用挂载方法，确保应用一定会被挂载
setTimeout(() => {
  if (!appMounted) {
    ui.warn('使用备用方法挂载应用', { fallback: true }, 'fallback-mount');
    mountApp();
  }
}, 1000);
