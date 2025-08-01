/**
 * 桌面端用户体验增强 Composable
 * 集成Electron原生功能，提供桌面端特有的用户体验
 */

import { ref, computed, onMounted, onUnmounted, readonly } from 'vue';
import { useOnline, useWindowSize, useTitle } from '@vueuse/core';
import { useSmartLogger } from '../../infrastructure/utils/smartLogger';

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  release: string;
  hostname: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
  loadAverage: number[];
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  appVersion: string;
  isDevelopment: boolean;
  windowBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  isMaximized: boolean;
  isFullScreen: boolean;
}

export interface NetworkStatus {
  online: boolean;
  connectionType: string;
  effectiveType: string;
}

export interface NotificationOptions {
  icon?: string;
  silent?: boolean;
  urgency?: 'low' | 'normal' | 'critical';
  timeoutType?: 'default' | 'never';
  actions?: Array<{ type: string; text: string; }>;
}

export function useDesktopExperience() {
  const logger = useSmartLogger();

  // 检测是否在Electron环境中运行
  const isElectron = computed(() => !!window.electronAPI);

  // 网络状态
  const networkStatus = ref<NetworkStatus>({
    online: true,
    connectionType: 'unknown',
    effectiveType: 'unknown'
  });

  // 系统信息
  const systemInfo = ref<SystemInfo | null>(null);

  // 窗口状态
  const isWindowMaximized = ref(false);
  const windowSize = useWindowSize();
  const isOnlineVueUse = useOnline();

  // 性能提示
  const performanceHints = ref<string[]>([]);

  // 应用徽章计数
  const badgeCount = ref(0);

  /**
   * 显示系统通知
   */
  async function showNotification(
    title: string,
    body: string,
    options: NotificationOptions = {}
  ): Promise<boolean> {
    if (!isElectron.value) {
      logger.warn('系统通知不可用', '不在Electron环境中');
      return false;
    }

        try {
      const result = await window.electronAPI?.showNotification?.(title, body, options);

      if (result?.success) {
        logger.info('系统通知已显示', { title, body, id: result.id });
        return true;
      } else {
        logger.error('显示系统通知失败', result?.error);
        return false;
      }
    } catch (error) {
      logger.error('显示系统通知异常', error);
      return false;
    }
  }

  /**
   * 获取网络状态
   */
  async function updateNetworkStatus(): Promise<void> {
    if (!isElectron.value) {
      // 在非Electron环境中使用@vueuse/core的网络状态
      networkStatus.value = {
        online: isOnlineVueUse.value,
        connectionType: 'unknown',
        effectiveType: 'unknown'
      };
      return;
    }

    try {
      const result = await window.electronAPI?.getNetworkStatus?.();
      if (result?.success) {
        networkStatus.value = result.data;
        logger.debug('网络状态已更新', result.data);
      }
    } catch (error) {
      logger.error('获取网络状态失败', error);
    }
  }

  /**
   * 获取系统信息
   */
  async function updateSystemInfo(): Promise<void> {
    if (!isElectron.value) {
      logger.debug('系统信息不可用', '不在Electron环境中');
      return;
    }

        try {
      const result = await window.electronAPI?.getSystemInfo?.();
      if (result?.success && result.data) {
        systemInfo.value = result.data;
        isWindowMaximized.value = result.data.isMaximized;
        logger.debug('系统信息已更新', {
          platform: result.data.platform,
          version: result.data.appVersion,
          memory: `${Math.round(result.data.freeMemory / 1024 / 1024)}MB / ${Math.round(result.data.totalMemory / 1024 / 1024)}MB`
        });
      }
    } catch (error) {
      logger.error('获取系统信息失败', error);
    }
  }

  /**
   * 设置应用徽章数量
   */
  async function setAppBadge(count: number): Promise<boolean> {
    if (!isElectron.value) {
      logger.debug('应用徽章不可用', '不在Electron环境中');
      return false;
    }

    try {
      const result = await window.electronAPI?.setAppBadge?.(count);
      if (result?.success) {
        badgeCount.value = count;
        logger.debug('应用徽章已设置', { count });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('设置应用徽章失败', error);
      return false;
    }
  }

  /**
   * 清除应用徽章
   */
  async function clearAppBadge(): Promise<boolean> {
    return await setAppBadge(0);
  }

  /**
   * 窗口控制方法
   */
  const windowControls = {
    async minimize(): Promise<boolean> {
      if (!isElectron.value) return false;
      try {
        const result = await window.electronAPI?.minimize?.();
        logger.debug('窗口已最小化');
        return result?.success ?? false;
      } catch (error) {
        logger.error('窗口最小化失败', error);
        return false;
      }
    },

    async maximize(): Promise<boolean> {
      if (!isElectron.value) return false;
      try {
        const result = await window.electronAPI?.maximize?.();
        if (result?.success) {
          isWindowMaximized.value = result.isMaximized ?? false;
          logger.debug('窗口最大化状态已切换', { isMaximized: isWindowMaximized.value });
        }
        return result?.success ?? false;
      } catch (error) {
        logger.error('窗口最大化失败', error);
        return false;
      }
    },

    async close(): Promise<boolean> {
      if (!isElectron.value) return false;
      try {
        const result = await window.electronAPI?.close?.();
        logger.debug('窗口关闭请求已发送');
        return result?.success ?? false;
      } catch (error) {
        logger.error('窗口关闭失败', error);
        return false;
      }
    },

    async checkMaximized(): Promise<boolean> {
      if (!isElectron.value) return false;
      try {
        const result = await window.electronAPI?.isMaximized?.();
        if (result?.success) {
          isWindowMaximized.value = result.data ?? false;
        }
        return result?.data ?? false;
      } catch (error) {
        logger.error('检查窗口状态失败', error);
        return false;
      }
    }
  };

  /**
   * 发送桌面端游戏通知
   */
  async function sendGameNotification(
    type: 'achievement' | 'warning' | 'info' | 'success',
    message: string,
    details?: string
  ): Promise<boolean> {
    const notificationConfig = {
      achievement: {
        title: '🏆 成就达成！',
        urgency: 'low' as const,
        icon: '🏆'
      },
      warning: {
        title: '⚠️ 游戏提醒',
        urgency: 'normal' as const,
        icon: '⚠️'
      },
      info: {
        title: 'ℹ️ 游戏信息',
        urgency: 'low' as const,
        icon: 'ℹ️'
      },
      success: {
        title: '✅ 操作成功',
        urgency: 'low' as const,
        icon: '✅'
      }
    };

    const config = notificationConfig[type];
    const body = details ? `${message}\n${details}` : message;

    return await showNotification(config.title, body, {
      urgency: config.urgency,
      silent: false
    });
  }

  /**
   * 性能自适应提示
   */
  function addPerformanceHint(hint: string): void {
    performanceHints.value.push(hint);
    logger.info('性能提示添加', { hint });

    // 显示性能提示通知
    if (isElectron.value) {
      sendGameNotification('info', '性能优化建议', hint);
    }

    // 限制提示数量，避免内存泄漏
    if (performanceHints.value.length > 10) {
      performanceHints.value = performanceHints.value.slice(-10);
    }
  }

  /**
   * 清除性能提示
   */
  function clearPerformanceHints(): void {
    performanceHints.value = [];
    logger.debug('性能提示已清除');
  }

  /**
   * 自动化性能监控
   */
  function monitorPerformance(): void {
    if (!isElectron.value || !systemInfo.value) return;

    const { freeMemory, totalMemory } = systemInfo.value;
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    if (memoryUsagePercent > 85) {
      addPerformanceHint('内存使用率过高，建议关闭其他应用程序');
    }

    if (windowSize.width.value < 1024 || windowSize.height.value < 768) {
      addPerformanceHint('当前窗口尺寸较小，建议调整为更大尺寸以获得更好体验');
    }
  }

    // 设置网络状态变化监听
  function setupNetworkListener(): (() => void) | undefined {
    if (!isElectron.value) return;

    const cleanup = window.electronAPI?.onNetworkStatusChange?.((status: NetworkStatus) => {
      networkStatus.value = status;
      logger.info('网络状态变化', status);

      if (!status.online) {
        sendGameNotification('warning', '网络连接已断开', '某些功能可能无法正常使用');
      } else {
        sendGameNotification('success', '网络连接已恢复', '所有功能现已可用');
      }
    });

    return cleanup;
  }

  // 设置性能提示监听
  function setupPerformanceListener(): (() => void) | undefined {
    if (!isElectron.value) return;

    const cleanup = window.electronAPI?.onPerformanceHint?.((hint: string) => {
      addPerformanceHint(hint);
    });

    return cleanup;
  }

  // 生命周期管理
  let networkCleanup: (() => void) | undefined;
  let performanceCleanup: (() => void) | undefined;
  let performanceInterval: NodeJS.Timeout | undefined;

  onMounted(async () => {
    logger.info('桌面端体验增强初始化', { isElectron: isElectron.value });

    // 初始化数据
    await updateNetworkStatus();
    await updateSystemInfo();

    // 设置监听器
    networkCleanup = setupNetworkListener();
    performanceCleanup = setupPerformanceListener();

    // 定期监控性能
    performanceInterval = setInterval(() => {
      updateSystemInfo();
      monitorPerformance();
    }, 30000); // 每30秒检查一次
  });

  onUnmounted(() => {
    logger.debug('桌面端体验增强清理资源');

    // 清理监听器
    if (networkCleanup) networkCleanup();
    if (performanceCleanup) performanceCleanup();
    if (performanceInterval) clearInterval(performanceInterval);
  });

  return {
    // 状态
    isElectron: readonly(isElectron),
    networkStatus: readonly(networkStatus),
    systemInfo: readonly(systemInfo),
    isWindowMaximized: readonly(isWindowMaximized),
    performanceHints: readonly(performanceHints),
    badgeCount: readonly(badgeCount),

    // 方法
    showNotification,
    sendGameNotification,
    updateNetworkStatus,
    updateSystemInfo,
    setAppBadge,
    clearAppBadge,
    windowControls,
    addPerformanceHint,
    clearPerformanceHints,
    monitorPerformance,
  };
}

export type UseDesktopExperienceReturn = ReturnType<typeof useDesktopExperience>;
