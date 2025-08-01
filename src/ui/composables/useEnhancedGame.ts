/**
 * 增强游戏体验的Composable
 * 集成@vueuse/core 13.6的新功能，提供更好的用户体验
 */
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
  Ref
} from 'vue';
import {
  useLocalStorage,
  useSessionStorage,
  useDark,
  useToggle,
  useWindowSize,
  useElementVisibility,
  useIntersectionObserver,
  useMutationObserver,
  useResizeObserver,
  useEventListener,
  useThrottleFn,
  useDebounceFn,
  useTimeoutFn,
  useIntervalFn,
  useDocumentVisibility,
  usePageLeave,
  useFocus,
  useIdle,
  useOnline,
  useBattery,
  useMemory,
  usePermission,
  useWakeLock,
  useFullscreen,
  useShare,
  useVibrate,
  useFavicon,
  useTitle
} from '@vueuse/core';

export interface GameSettings {
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  difficulty: 'easy' | 'normal' | 'hard';
  language: string;
  notifications: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  memory: number;
  renderTime: number;
  isLowPerformance: boolean;
}

/**
 * 增强游戏体验的主Composable
 */
export function useEnhancedGame() {
  // === 游戏设置管理 - 使用localStorage持久化 ===
  const gameSettings = useLocalStorage<GameSettings>('game-settings', {
    theme: 'auto',
    soundEnabled: true,
    animationsEnabled: true,
    autoSave: true,
    autoSaveInterval: 30000, // 30秒
    difficulty: 'normal',
    language: 'zh-CN',
    notifications: true
  });

  // === 主题管理 - VueUse 13.6增强版 ===
  const isDark = useDark({
    selector: 'html',
    attribute: 'data-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'game-theme'
  });
  const toggleDark = useToggle(isDark);

  // === 窗口和可见性检测 ===
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const documentVisibility = useDocumentVisibility();
  const isPageVisible = computed(() => documentVisibility.value === 'visible');
  const isOnline = useOnline();

  // === 性能监控 - VueUse 13.6新功能 ===
  const memory = useMemory();
  const battery = useBattery();

  const performanceMetrics = computed<PerformanceMetrics>(() => ({
    fps: 60, // 实际实现中需要计算真实FPS
    memory: memory.value?.usedJSHeapSize || 0,
    renderTime: 0, // 需要实际测量
    isLowPerformance: (memory.value?.usedJSHeapSize || 0) > 100 * 1024 * 1024 // 100MB阈值
  }));

  // === 游戏状态管理 ===
  const gameSessionData = useSessionStorage('game-session', {
    startTime: Date.now(),
    playTime: 0,
    lastSaveTime: Date.now(),
    sessionScore: 0
  });

  // === 用户交互检测 ===
  const { idle, lastActive } = useIdle(300000); // 5分钟空闲检测
  const isUserIdle = computed(() => idle.value);

  // === 自动保存功能 ===
  const { start: startAutoSave, stop: stopAutoSave } = useIntervalFn(() => {
    if (gameSettings.value.autoSave && isPageVisible.value && !isUserIdle.value) {
      triggerAutoSave();
    }
  }, () => gameSettings.value.autoSaveInterval);

  const triggerAutoSave = useDebounceFn(() => {
    console.log('自动保存游戏...');
    gameSessionData.value.lastSaveTime = Date.now();
    // 这里添加实际的保存逻辑
  }, 1000);

  // === 性能优化功能 ===
  const optimizePerformance = useThrottleFn(() => {
    if (performanceMetrics.value.isLowPerformance) {
      // 降低动画质量
      gameSettings.value.animationsEnabled = false;
      console.log('检测到低性能设备，已禁用动画');
    }
  }, 5000);

  // === 通知管理 ===
  const notificationPermission = usePermission('notifications');

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (gameSettings.value.notifications && notificationPermission.value === 'granted') {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options
      });
    }
  };

  // === 全屏和唤醒锁定 ===
  const { isFullscreen, enter: enterFullscreen, exit: exitFullscreen } = useFullscreen();
  const { isSupported: wakeLockSupported, request: requestWakeLock } = useWakeLock();

  // === 分享功能 ===
  const { share, isSupported: shareSupported } = useShare();

  const shareScore = (score: number) => {
    if (shareSupported.value) {
      share({
        title: '《买房记》游戏成绩',
        text: `我在《买房记》中获得了 ${score} 分！`,
        url: window.location.href
      });
    }
  };

  // === 震动反馈 ===
  const { vibrate, isSupported: vibrateSupported } = useVibrate();

  const gameVibrate = (pattern: number | number[] = 200) => {
    if (vibrateSupported.value && gameSettings.value.soundEnabled) {
      vibrate(pattern);
    }
  };

    // === SEO和元数据管理 ===
  const gameTitle = useTitle('《买房记》- 模拟经营游戏');
  const gameFavicon = useFavicon('/ico.ico');

  // 元数据管理 - 手动设置（useMeta在当前版本不可用）
  const setMetaTags = () => {
    const metaTags = [
      { name: 'description', content: '《买房记》是一款模拟经营类游戏，通过买卖商品赚取利润，最终购买房产。' },
      { name: 'keywords', content: '买房记,模拟经营,游戏,Vue3,房产,投资' },
      { property: 'og:title', content: '《买房记》- 模拟经营游戏' },
      { property: 'og:description', content: '通过买卖商品赚取利润，实现购房梦想！' },
      { property: 'og:image', content: '/logo.png' }
    ];

    metaTags.forEach(tag => {
      const metaElement = document.createElement('meta');
      Object.entries(tag).forEach(([key, value]) => {
        metaElement.setAttribute(key, value);
      });
      document.head.appendChild(metaElement);
    });
  };

  // === 生命周期管理 ===
  onMounted(() => {
    // 设置元数据标签
    setMetaTags();

    // 启动自动保存
    if (gameSettings.value.autoSave) {
      startAutoSave();
    }

    // 启动性能监控
    optimizePerformance();

    // 请求通知权限
    if (gameSettings.value.notifications && notificationPermission.value === 'prompt') {
      navigator.permissions?.query({ name: 'notifications' as PermissionName });
    }

    // 游戏开始时请求唤醒锁定
    if (wakeLockSupported.value) {
      requestWakeLock();
    }
  });

  onUnmounted(() => {
    stopAutoSave();
  });

  // === 监听器设置 ===

  // 监听页面可见性，暂停/恢复游戏
  watch(isPageVisible, (visible) => {
    if (visible) {
      console.log('游戏恢复');
      if (gameSettings.value.autoSave) {
        startAutoSave();
      }
    } else {
      console.log('游戏暂停');
      stopAutoSave();
      triggerAutoSave(); // 离开时立即保存
    }
  });

  // 监听网络状态
  watch(isOnline, (online) => {
    if (online) {
      sendNotification('网络已连接', { body: '游戏数据同步已恢复' });
    } else {
      sendNotification('网络已断开', { body: '游戏将在离线模式下运行' });
    }
  });

  // 监听空闲状态
  watch(isUserIdle, (idle) => {
    if (idle) {
      console.log('用户空闲，暂停部分功能');
      // 可以在这里暂停一些不必要的计算
    } else {
      console.log('用户恢复活动');
    }
  });

  // 监听性能指标
  watch(performanceMetrics, (metrics) => {
    if (metrics.isLowPerformance) {
      optimizePerformance();
    }
  }, { deep: true });

  // === 导出接口 ===
  return {
    // 设置和状态
    gameSettings,
    gameSessionData,
    performanceMetrics,

    // 主题
    isDark,
    toggleDark,

    // 窗口和可见性
    windowWidth,
    windowHeight,
    isPageVisible,
    isOnline,
    isUserIdle,
    lastActive,

    // 电池和内存
    battery,
    memory,

    // 全屏
    isFullscreen,
    enterFullscreen,
    exitFullscreen,

    // 功能方法
    triggerAutoSave,
    sendNotification,
    shareScore,
    gameVibrate,
    optimizePerformance,

    // 权限和支持检测
    notificationPermission,
    shareSupported,
    vibrateSupported,
    wakeLockSupported,

    // 元数据
    gameTitle,
    gameFavicon
  };
}

/**
 * 组件可见性检测Composable
 */
export function useComponentVisibility(target: Ref<HTMLElement | null>) {
  const targetIsVisible = useElementVisibility(target);

  const { stop } = useIntersectionObserver(
    target,
    ([{ isIntersecting }]) => {
      if (isIntersecting) {
        console.log('组件进入视口');
      }
    }
  );

  return {
    isVisible: targetIsVisible,
    stopObserver: stop
  };
}

/**
 * 响应式布局Composable
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowSize();

  const isMobile = computed(() => width.value < 768);
  const isTablet = computed(() => width.value >= 768 && width.value < 1024);
  const isDesktop = computed(() => width.value >= 1024);
  const isLandscape = computed(() => width.value > height.value);

  const layoutClass = computed(() => {
    if (isMobile.value) return 'layout-mobile';
    if (isTablet.value) return 'layout-tablet';
    return 'layout-desktop';
  });

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    layoutClass
  };
}
