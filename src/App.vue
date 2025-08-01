<template>
  <div
    id="app"
    :class="[
      layoutClass,
      {
        'dark-theme': isDark,
        'offline': !isOnline,
        'low-performance': performanceMetrics.isLowPerformance
      }
    ]"
    :data-theme="isDark ? 'dark' : 'light'"
  >
    <!-- 全局CSS加载动画，在Vue应用初始化前显示 -->
    <CssLoader
      v-if="isLoading"
      :title="'正在初始化游戏'"
      :status="loadingStatus"
      :progress="loadingProgress"
      @complete="onLoadingComplete"
    />

    <!-- 主应用内容 - 增强布局适配 -->
    <router-view
      v-if="!isLoading"
      :class="[
        'main-content',
        {
          'mobile-layout': isMobile,
          'tablet-layout': isTablet,
          'desktop-layout': isDesktop
        }
      ]"
    />

    <!-- 全局错误对话框 -->
    <ErrorDialog />

    <!-- 恢复对话框 -->
    <ErrorRecoveryDialog />

    <!-- 通用对话框 -->
    <GameDialog />

    <!-- 全局Toast通知 -->
    <Toast />

    <!-- 全局音频管理器 -->
    <AudioManager />

    <!-- 开发工具管理器 -->
    <DevToolsManager />

    <!-- 桌面端性能监控指示器 - @vueuse/core 13.6 新特性 -->
    <DesktopPerformanceIndicator />

    <!-- 网络状态指示器 -->
    <div v-if="!isOnline" class="offline-indicator">
      <i class="icon-wifi-off"></i>
      <span>离线模式</span>
    </div>

    <!-- 性能优化提示 -->
    <div v-if="performanceMetrics.isLowPerformance" class="performance-warning">
      <i class="icon-warning"></i>
      <span>性能优化模式已启用</span>
    </div>
  </div>
</template>

<script setup>
// Vue 3.5 + Pinia 3.0 + @vueuse/core 13.6 现代化重构
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

// 组件导入
import ErrorDialog from './ui/components/common/ErrorDialog.vue';
import ErrorRecoveryDialog from './ui/components/common/ErrorRecoveryDialog.vue';
import GameDialog from './ui/components/common/GameDialog.vue';
import Toast from './ui/components/common/Toast.vue';
import AudioManager from './ui/components/common/AudioManager.vue';
import CssLoader from './ui/components/common/CssLoader.vue';
import DevToolsManager from './ui/components/common/DevToolsManager.vue';
import DesktopPerformanceIndicator from './ui/components/common/DesktopPerformanceIndicator.vue';

// Store导入 - Pinia 3.0优化版本
import { useUiStore } from './stores/uiStore';
import { useGameCoreStore } from './stores/gameCore';
import { usePlayerStore } from './stores/player';
import { useMarketStore } from './stores/market';
import { useEventStore } from './stores/events';

// 新增Composables - @vueuse/core 13.6功能集成
import { useEnhancedGame, useResponsiveLayout } from './ui/composables/useEnhancedGame';

// 工具导入
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';

// === Setup Script - Vue 3.5 现代化语法 ===

// 路由
const router = useRouter();

// === 增强游戏功能集成 - @vueuse/core 13.6 ===
const {
  gameSettings,
  isDark,
  toggleDark,
  isPageVisible,
  isOnline,
  performanceMetrics,
  sendNotification,
  gameVibrate,
  optimizePerformance
} = useEnhancedGame();

// 响应式布局
const { isMobile, isTablet, isDesktop, layoutClass } = useResponsiveLayout();

// === Store实例 - Pinia 3.0 优化版本 ===
const uiStore = useUiStore();
const gameCoreStore = useGameCoreStore();
const playerStore = usePlayerStore();
const marketStore = useMarketStore();
const eventStore = useEventStore();

// 使用storeToRefs保持响应性 - Pinia 3.0最佳实践
const { /* 在需要时从stores解构状态 */ } = storeToRefs(uiStore);

// === 加载状态管理 ===
const isLoading = ref(true);
const loadingStatus = ref('初始化游戏环境...');
const loadingProgress = ref(0);

// === 应用初始化函数 - Vue 3.5 + @vueuse增强版本 ===
const initializeApp = async () => {
  try {
    loadingStatus.value = '初始化存储...';
    loadingProgress.value = 10;

    // Store实例已在上面定义，无需重复获取
    loadingStatus.value = '加载游戏配置...';
    loadingProgress.value = 30;

    // 性能优化：根据设备性能调整初始化
    if (performanceMetrics.value.isLowPerformance) {
      optimizePerformance();
      await new Promise(resolve => setTimeout(resolve, 100)); // 减少等待时间
    } else {
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    loadingStatus.value = '准备游戏界面...';
    loadingProgress.value = 60;

    // 等待DOM更新
    await nextTick();

    loadingStatus.value = '完成初始化...';
    loadingProgress.value = 90;

    // 在线状态检查
    if (!isOnline.value) {
      sendNotification('离线模式', {
        body: '当前处于离线模式，部分功能可能受限'
      });
    }

    // 性能调优的等待时间
    const waitTime = performanceMetrics.value.isLowPerformance ? 200 : 500;
    await new Promise(resolve => setTimeout(resolve, waitTime));

    loadingStatus.value = '加载完成!';
    loadingProgress.value = 100;

    // 触觉反馈
    gameVibrate([100, 50, 100]);

    // 延迟隐藏加载界面
    setTimeout(() => {
      isLoading.value = false;
      sendNotification('《买房记》', {
        body: '游戏已就绪，开始您的买房之旅！',
        silent: true
      });
    }, 300);

  } catch (error) {
    handleError(error, 'App初始化', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('初始化应用失败:', error);
    loadingStatus.value = '初始化失败，请刷新页面重试';

    // 错误时的触觉反馈
    gameVibrate([200, 100, 200, 100, 200]);
  }
};

// === 回调函数 ===
const onLoadingComplete = () => {
  console.log('应用初始化完成');
  isLoading.value = false;
};

// === 生命周期钩子 - Vue 3.5 ===
onMounted(() => {
  console.log('App组件挂载，开始初始化...');
  initializeApp();
});

// === 监听器 - 增强功能 ===
watch(isPageVisible, (visible) => {
  if (visible) {
    console.log('页面重新获得焦点');
  } else {
    console.log('页面失去焦点');
  }
});

watch(isOnline, (online) => {
  if (online) {
    console.log('网络连接恢复');
    sendNotification('网络已连接', { body: '游戏功能已恢复正常' });
  } else {
    console.log('网络连接断开');
    sendNotification('网络已断开', { body: '游戏将在离线模式下运行' });
  }
});

// 性能监控
watch(performanceMetrics, (metrics) => {
  if (metrics.isLowPerformance) {
    console.log('检测到低性能环境，启用性能优化');
    optimizePerformance();
  }
}, { deep: true });
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f5f7fa;
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

/* === 响应式布局增强 - @vueuse/core 13.6 === */
.layout-mobile {
  font-size: 14px;
}

.layout-tablet {
  font-size: 15px;
}

.layout-desktop {
  font-size: 16px;
}

/* === 主题支持 === */
[data-theme="dark"] {
  background-color: #1a1a2e;
  color: #ffffff;
}

[data-theme="light"] {
  background-color: #f5f7fa;
  color: #2c3e50;
}

.dark-theme {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
}

/* === 网络状态指示器 === */
.offline-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #ff6b6b;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: pulse 2s infinite;
}

.offline-indicator i::before {
  content: "📶";
}

/* === 性能优化提示 === */
.performance-warning {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #ffd93d;
  color: #333;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideInUp 0.5s ease;
}

.performance-warning i::before {
  content: "⚡";
}

/* === 主内容区域适配 === */
.main-content {
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
}

.main-content.mobile-layout {
  padding: 10px;
}

.main-content.tablet-layout {
  padding: 15px;
}

.main-content.desktop-layout {
  padding: 20px;
}

/* === 低性能模式优化 === */
.low-performance * {
  animation: none !important;
  transition: none !important;
}

.low-performance .main-content {
  will-change: auto;
  transform: none;
}

/* 全局加载动画样式 */
#app-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #1a1a2e;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

/* 通用样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 20px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
}

.dialog-title {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #2c3e50;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.dialog-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 10px;
}

.dialog-button.confirm {
  background-color: #4caf50;
  color: white;
}

.dialog-button.cancel {
  background-color: #f44336;
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog {
    width: 95%;
    max-height: 80%;
  }
}
</style>
