/**
 * 游戏布局组合函数
 * 管理游戏界面的布局状态和交互逻辑
 */

import { ref, computed, watch } from 'vue';
import { useDesktopLayout } from '../../../shared/lib/composables';
import type { GameLayoutConfig, GameLayoutState, TabInfo } from './types';

export function useGameLayout() {
  // 状态管理
  const state = ref<GameLayoutState>({
    config: {
      showSidebar: true,
      sidebarWidth: 300,
      activeTab: 'market',
      showDevTools: false,
      isFullscreen: false
    },
    isLoading: false,
    error: null
  });

  // 桌面布局功能
  const { 
    screenInfo, 
    windowControls, 
    isFullscreen: desktopFullscreen 
  } = useDesktopLayout();

  // 计算属性
  const activeTab = computed({
    get: () => state.value.config.activeTab,
    set: (tab: 'market' | 'inventory' | 'houses') => {
      state.value.config.activeTab = tab;
    }
  });

  const showSidebar = computed({
    get: () => state.value.config.showSidebar,
    set: (show: boolean) => {
      state.value.config.showSidebar = show;
    }
  });

  const layoutClasses = computed(() => ({
    'sidebar-visible': state.value.config.showSidebar,
    'fullscreen': state.value.config.isFullscreen,
    'compact': screenInfo.value.width < 1200,
    'dev-tools-open': state.value.config.showDevTools
  }));

  // 标签页配置
  const tabs = computed<TabInfo[]>(() => [
    {
      id: 'market',
      name: '市场',
      icon: '🏪'
    },
    {
      id: 'inventory',
      name: '背包',
      icon: '🎒'
    },
    {
      id: 'houses',
      name: '房产',
      icon: '🏠'
    }
  ]);

  // 方法
  const switchTab = (tabId: string) => {
    const validTabs = ['market', 'inventory', 'houses'] as const;
    if (validTabs.includes(tabId as any)) {
      activeTab.value = tabId as typeof validTabs[number];
    }
  };

  const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value;
  };

  const toggleFullscreen = () => {
    state.value.config.isFullscreen = !state.value.config.isFullscreen;
    windowControls.toggleFullscreen();
  };

  const toggleDevTools = () => {
    state.value.config.showDevTools = !state.value.config.showDevTools;
  };

  const setSidebarWidth = (width: number) => {
    if (width >= 200 && width <= 500) {
      state.value.config.sidebarWidth = width;
    }
  };

  const resetLayout = () => {
    state.value.config = {
      showSidebar: true,
      sidebarWidth: 300,
      activeTab: 'market',
      showDevTools: false,
      isFullscreen: false
    };
  };

  // 监听桌面全屏状态变化
  watch(desktopFullscreen, (newValue) => {
    state.value.config.isFullscreen = newValue;
  });

  return {
    // 状态
    state: computed(() => state.value),
    activeTab,
    showSidebar,
    layoutClasses,
    tabs,
    screenInfo,
    
    // 方法
    switchTab,
    toggleSidebar,
    toggleFullscreen,
    toggleDevTools,
    setSidebarWidth,
    resetLayout
  };
}