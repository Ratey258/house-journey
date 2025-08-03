/**
 * 游戏页面组合函数
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import type { GamePageState, GamePageConfig } from './types';

export function useGamePage() {
  const router = useRouter();

  // 页面状态
  const state = ref<GamePageState>({
    isInitialized: false,
    isLoading: true,
    error: null,
    currentView: 'game'
  });

  // 页面配置
  const config = ref<GamePageConfig>({
    autoSave: true,
    showTutorial: false,
    soundEnabled: true,
    theme: 'auto'
  });

  // 计算属性
  const pageTitle = computed(() => {
    const viewTitles = {
      game: '《买房记》- 游戏主界面',
      market: '《买房记》- 市场交易',
      inventory: '《买房记》- 背包管理',
      houses: '《买房记》- 房产管理'
    };
    return viewTitles[state.value.currentView];
  });

  const isReady = computed(() => 
    state.value.isInitialized && !state.value.isLoading && !state.value.error
  );

  // 初始化游戏页面
  const initializePage = async () => {
    state.value.isLoading = true;
    state.value.error = null;

    try {
      // 模拟初始化过程
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 加载游戏配置
      await loadGameConfig();
      
      // 初始化游戏数据
      await initializeGameData();
      
      state.value.isInitialized = true;
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '初始化失败';
    } finally {
      state.value.isLoading = false;
    }
  };

  // 加载游戏配置
  const loadGameConfig = async () => {
    // 从本地存储加载配置
    const savedConfig = localStorage.getItem('game-config');
    if (savedConfig) {
      try {
        config.value = { ...config.value, ...JSON.parse(savedConfig) };
      } catch (error) {
        console.warn('Failed to load game config:', error);
      }
    }
  };

  // 初始化游戏数据
  const initializeGameData = async () => {
    // 这里可以初始化玩家数据、市场数据等
    // 实际实现会调用相关的服务
  };

  // 保存游戏配置
  const saveGameConfig = () => {
    try {
      localStorage.setItem('game-config', JSON.stringify(config.value));
    } catch (error) {
      console.warn('Failed to save game config:', error);
    }
  };

  // 切换当前视图
  const switchView = (view: GamePageState['currentView']) => {
    state.value.currentView = view;
    
    // 更新页面标题
    document.title = pageTitle.value;
  };

  // 导航到其他页面
  const navigateToMarket = () => {
    router.push('/market');
  };

  const navigateToPlayer = () => {
    router.push('/player');
  };

  const navigateToSettings = () => {
    router.push('/settings');
  };

  // 错误重试
  const retryInitialization = () => {
    initializePage();
  };

  // 生命周期
  onMounted(() => {
    initializePage();
  });

  onUnmounted(() => {
    saveGameConfig();
  });

  return {
    // 状态
    state: computed(() => state.value),
    config: computed(() => config.value),
    pageTitle,
    isReady,

    // 方法
    switchView,
    navigateToMarket,
    navigateToPlayer,
    navigateToSettings,
    retryInitialization,
    saveGameConfig
  };
}