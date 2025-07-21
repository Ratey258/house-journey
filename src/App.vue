<template>
  <div id="app">
    <!-- 全局CSS加载动画，在Vue应用初始化前显示 -->
    <CssLoader 
      v-if="isLoading" 
      :title="'正在初始化游戏'" 
      :status="loadingStatus"
      :progress="loadingProgress"
      @complete="onLoadingComplete"
    />
    
    <!-- 主应用内容 -->
    <router-view v-if="!isLoading" />
    
    <!-- 全局错误对话框 -->
    <ErrorDialog />
    
    <!-- 恢复对话框 -->
    <ErrorRecoveryDialog />
    
    <!-- 全局Toast通知 -->
    <Toast />
    
    <!-- 全局音频管理器 -->
    <AudioManager />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import ErrorDialog from './ui/components/common/ErrorDialog.vue';
import ErrorRecoveryDialog from './ui/components/common/ErrorRecoveryDialog.vue';
import Toast from './ui/components/common/Toast.vue';
import AudioManager from './ui/components/common/AudioManager.vue';
import CssLoader from './ui/components/common/CssLoader.vue';
import { useUiStore } from './stores/uiStore';
import { useGameCoreStore } from './stores/gameCore';
import { usePlayerStore } from './stores/player';
import { useMarketStore } from './stores/market';
import { useEventStore } from './stores/events';
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';

export default defineComponent({
  name: 'App',
  components: {
    ErrorDialog,
    ErrorRecoveryDialog,
    Toast,
    AudioManager,
    CssLoader
  },
  setup() {
    const router = useRouter();
    const isLoading = ref(true);
    const loadingStatus = ref('初始化游戏环境...');
    const loadingProgress = ref(0);
    
    // 应用初始化函数
    const initializeApp = async () => {
      try {
        loadingStatus.value = '初始化存储...';
        loadingProgress.value = 10;
        
        // 获取存储实例
        const uiStore = useUiStore();
        const gameCoreStore = useGameCoreStore();
        const playerStore = usePlayerStore();
        const marketStore = useMarketStore();
        const eventStore = useEventStore();
        
        loadingStatus.value = '加载游戏配置...';
        loadingProgress.value = 30;
        
        // 预加载一些关键数据
        await new Promise(resolve => setTimeout(resolve, 300));
        
        loadingStatus.value = '准备游戏界面...';
        loadingProgress.value = 60;
        
        // 等待DOM更新
        await nextTick();
        
        loadingStatus.value = '完成初始化...';
        loadingProgress.value = 90;
        
        // 再等待一小段时间，确保界面平滑过渡
        await new Promise(resolve => setTimeout(resolve, 500));
        
        loadingStatus.value = '加载完成!';
        loadingProgress.value = 100;
        
        // 延迟一小段时间后隐藏加载界面
        setTimeout(() => {
          isLoading.value = false;
        }, 500);
      } catch (error) {
        handleError(error, 'App (src)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
        console.error('初始化应用失败:', error);
        loadingStatus.value = '初始化失败，请刷新页面重试';
      }
    };
    
    // 加载完成回调
    const onLoadingComplete = () => {
      console.log('应用初始化完成');
      isLoading.value = false;
    };
    
    // 组件挂载时
    onMounted(() => {
      // 初始化应用
      initializeApp();
    });
    
    return {
      isLoading,
      loadingStatus,
      loadingProgress,
      onLoadingComplete
    };
  }
});
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