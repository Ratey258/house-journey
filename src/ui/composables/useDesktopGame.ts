/**
 * useDesktopGame Composable
 * 桌面端游戏专用功能
 *
 * 🎯 特性:
 * - 键盘快捷键管理
 * - 桌面端窗口管理
 * - 性能监控集成
 * - 主题和设置管理
 * - Electron原生功能
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  useWindowSize,
  useDocumentVisibility,
  useOnline,
  useDark,
  useEventListener
} from '@vueuse/core';
import { useDesktopMonitoring } from './useDesktopMonitoring';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import { useEventBus } from '@/infrastructure/state/event-bus';
import { useSmartLogger } from '@/infrastructure/utils/smartLogger';

export interface KeyboardShortcuts {
  space: () => void;           // 空格键 - 下一周
  tab: () => void;             // Tab键 - 切换标签
  shiftTab: () => void;        // Shift+Tab - 反向切换标签
  escape: () => void;          // ESC键 - 菜单切换
  h: () => void;              // H键 - 帮助
  s: () => void;              // Ctrl+S - 保存游戏
  f11: () => void;            // F11 - 全屏切换
}

export function useDesktopGame() {
  const logger = useSmartLogger();
  const eventBus = useEventBus();

  // Store引用
  const settingsStore = useSettingsStore();
  const uiStore = useUiStore();

  // 桌面端状态
  const isElectron = computed(() => typeof window !== 'undefined' && window.electronAPI);
  const isDevelopmentMode = ref(true); // 开发模式标志

  // @vueuse核心功能
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const documentVisibility = useDocumentVisibility();
  const isOnline = useOnline();
  const isDark = useDark();

  // 桌面端性能监控
  const desktopMonitoring = useDesktopMonitoring();

  // 键盘快捷键回调存储
  const keyboardCallbacks = ref<Partial<KeyboardShortcuts>>({});

  // ===== 计算属性 =====

  const windowSize = computed(() => ({
    width: windowWidth.value,
    height: windowHeight.value,
    isLargeScreen: windowWidth.value >= 1440,
    isUltraWide: windowWidth.value >= 2560,
    aspectRatio: windowWidth.value / windowHeight.value
  }));

  const gameSettings = computed(() => ({
    theme: isDark.value ? 'dark' : 'light',
    language: settingsStore.language,
    soundEnabled: settingsStore.soundEnabled,
    animationsEnabled: settingsStore.animationsEnabled,
    autoSave: settingsStore.autoSave,
    difficulty: settingsStore.difficulty || 'normal'
  }));

  const performanceMetrics = computed(() => ({
    ...desktopMonitoring.performanceData.value,
    isVisible: documentVisibility.value === 'visible',
    networkStatus: isOnline.value ? 'online' : 'offline',
    windowOptimized: windowSize.value.isLargeScreen
  }));

  // ===== 键盘快捷键管理 =====

  /**
   * 注册键盘快捷键
   */
  const registerShortcuts = (callbacks: Partial<KeyboardShortcuts>): void => {
    keyboardCallbacks.value = { ...keyboardCallbacks.value, ...callbacks };
    logger.info('注册桌面端快捷键', {
      shortcuts: Object.keys(callbacks),
      total: Object.keys(keyboardCallbacks.value).length
    });
  };

  /**
   * 键盘事件处理器
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    // 如果有模态框打开或输入框聚焦，不处理快捷键
    if (uiStore.hasOpenModal || isInputFocused()) {
      return;
    }

    const { key, ctrlKey, shiftKey } = event;

    // 处理快捷键
    switch (key) {
      case ' ': // 空格键
        event.preventDefault();
        keyboardCallbacks.value.space?.();
        logShortcut('SPACE', '进入下一周');
        break;

      case 'Tab': // Tab键
        event.preventDefault();
        if (shiftKey) {
          keyboardCallbacks.value.shiftTab?.();
          logShortcut('SHIFT+TAB', '反向切换标签');
        } else {
          keyboardCallbacks.value.tab?.();
          logShortcut('TAB', '切换标签');
        }
        break;

      case 'Escape': // ESC键
        keyboardCallbacks.value.escape?.();
        logShortcut('ESC', '切换菜单');
        break;

      case 'h':
      case 'H':
        keyboardCallbacks.value.h?.();
        logShortcut('H', '显示帮助');
        break;

      case 's':
      case 'S':
        if (ctrlKey) {
          event.preventDefault();
          keyboardCallbacks.value.s?.();
          logShortcut('CTRL+S', '保存游戏');
        }
        break;

      case 'F11':
        event.preventDefault();
        keyboardCallbacks.value.f11?.();
        logShortcut('F11', '切换全屏');
        break;
    }
  };

  /**
   * 检查是否有输入框聚焦
   */
  const isInputFocused = (): boolean => {
    const activeElement = document.activeElement;
    return !!(activeElement && (
      activeElement.tagName.toLowerCase() === 'input' ||
      activeElement.tagName.toLowerCase() === 'textarea' ||
      activeElement.hasAttribute('contenteditable')
    ));
  };

  /**
   * 记录快捷键使用
   */
  const logShortcut = (shortcut: string, action: string): void => {
    logger.debug('桌面端快捷键', { shortcut, action });

    // 发布快捷键使用事件
    eventBus.emit('system:notification', {
      type: 'debug',
      title: '快捷键',
      message: `${shortcut}: ${action}`
    });
  };

  // ===== 窗口管理 =====

  /**
   * Electron窗口控制
   */
  const windowControls = computed(() => {
    if (!isElectron.value) return null;

    return {
      minimize: () => (window as any).electronAPI?.minimize?.(),
      maximize: () => (window as any).electronAPI?.maximize?.(),
      close: () => (window as any).electronAPI?.close?.(),
      toggleFullscreen: () => {
        (window as any).electronAPI?.toggleFullscreen?.();
        logShortcut('WINDOW', '切换全屏');
      }
    };
  });

  /**
   * 系统通知（已禁用）
   */
  const showSystemNotification = (title: string, body: string, options?: NotificationOptions): void => {
    // 禁用所有原生通知，仅使用应用内通知
    eventBus.emit('ui:toast:show', {
      type: 'info',
      message: `${title}: ${body}`,
      duration: 5000
    });
    logger.debug('显示应用内通知（原生通知已禁用）', { title, body });
  };

  // ===== 主题管理 =====

  /**
   * 切换主题
   */
  const toggleTheme = (): void => {
    isDark.value = !isDark.value;
    settingsStore.setTheme(isDark.value ? 'dark' : 'light');

    eventBus.emit('ui:theme:changed', {
      theme: isDark.value ? 'dark' : 'light'
    });

    logger.info('切换主题', { theme: isDark.value ? 'dark' : 'light' });
  };

  /**
   * 自动主题检测
   */
  const enableAutoTheme = (): void => {
    // 监听系统主题变化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleThemeChange = (e: MediaQueryListEvent) => {
        isDark.value = e.matches;
        settingsStore.setTheme('auto');
        logger.info('系统主题变化', { theme: e.matches ? 'dark' : 'light' });
      };

      mediaQuery.addListener(handleThemeChange);

      // 清理函数
      onUnmounted(() => {
        mediaQuery.removeListener(handleThemeChange);
      });
    }
  };

  // ===== 性能优化 =====

  /**
   * 桌面端性能优化建议
   */
  const getOptimizationSuggestions = () => {
    const suggestions: string[] = [];
    const metrics = performanceMetrics.value;

    if (metrics.memoryUsagePercent > 80) {
      suggestions.push('内存使用率过高，建议重启游戏');
    }

    if (!windowSize.value.isLargeScreen) {
      suggestions.push('建议使用更大的窗口以获得更好体验');
    }

    if (!isOnline.value) {
      suggestions.push('网络连接中断，某些功能可能不可用');
    }

    if (documentVisibility.value !== 'visible') {
      suggestions.push('窗口未激活，游戏已暂停更新');
    }

    return suggestions;
  };

  // ===== 生命周期管理 =====

  onMounted(() => {
    logger.info('桌面端游戏系统初始化', {
      isElectron: isElectron.value,
      windowSize: windowSize.value,
      theme: gameSettings.value.theme,
      performanceScore: desktopMonitoring.performanceScore.value
    });

    // 自动主题检测
    if (settingsStore.theme === 'auto') {
      enableAutoTheme();
    }

    // 开始性能监控
    desktopMonitoring.startMonitoring();

    // 发布初始化完成事件
    eventBus.emit('system:notification', {
      type: 'info',
      title: '桌面端初始化',
      message: '桌面端功能已激活'
    });
  });

  onUnmounted(() => {
    logger.info('桌面端游戏系统清理');

    // 停止性能监控
    desktopMonitoring.stopMonitoring();
  });

  // 注册全局键盘监听器
  useEventListener('keydown', handleKeyDown);

  return {
    // 状态
    isElectron,
    isDevelopmentMode,
    windowSize,
    gameSettings,
    performanceMetrics,
    isDark,
    isOnline,
    documentVisibility,

    // 性能监控
    ...desktopMonitoring,

    // 方法
    registerShortcuts,
    windowControls,
    showSystemNotification,
    toggleTheme,
    enableAutoTheme,
    getOptimizationSuggestions
  };
}
