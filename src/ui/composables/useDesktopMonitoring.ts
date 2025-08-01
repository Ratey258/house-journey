/**
 * 桌面端性能监控 Composable
 * 基于 @vueuse/core 13.6 实现
 * 专门针对桌面端（网页+Electron）优化
 * TypeScript版本
 */
import {
  useMemory,
  useWindowSize,
  useDocumentVisibility,
  useOnline,
  useIdle,
  useFullscreen,
  useEventListener
} from '@vueuse/core';
import { computed, ref, watch, onMounted, readonly, type Ref } from 'vue';
import { useSmartLogger } from '../../infrastructure/utils/smartLogger';

// 性能指标接口
export interface PerformanceMetrics {
  memoryUsage: number;
  memoryLimit: number;
  memoryUsagePercent: string;
  isLowPerformance: boolean;
  screenSize: { width: number; height: number };
  isLargeScreen: boolean;
  isUltraWide: boolean;
  isVisible: boolean;
  networkStatus: boolean;
  isUserIdle: boolean;
  isFullscreenMode: boolean;
  timestamp: number;
}

// 性能趋势接口
export interface PerformanceTrends {
  avgMemoryUsage: number;
  memoryTrend: 'increasing' | 'decreasing' | 'stable';
  performanceScore: number;
  recommendations: PerformanceRecommendation[];
}

// 性能建议接口
export interface PerformanceRecommendation {
  type: 'warning' | 'info' | 'success';
  message: string;
  action: string;
  severity?: 'low' | 'medium' | 'high';
}

// 自动优化状态接口
export interface AutoOptimization {
  animationsDisabled: boolean;
  reducedMotion: boolean;
  backgroundProcessingPaused: boolean;
  lastOptimizationTime: number;
}

// Electron特性接口
export interface ElectronFeatures {
  isElectron: boolean;
  canMinimize: boolean;
  canMaximize: boolean;
  canToggleFullscreen: boolean;
}

// 性能警报接口
export interface PerformanceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
  actions?: Array<{ label: string; action: string }>;
}

export function useDesktopMonitoring() {
  const logger = useSmartLogger();

  // 桌面端性能监控核心API
  const memory = useMemory();
  const { width, height } = useWindowSize();
  const isOnline = useOnline();
  const documentVisibility = useDocumentVisibility();
  const { idle } = useIdle(5 * 60 * 1000); // 5分钟无操作视为空闲
  const { isFullscreen } = useFullscreen();

  // 性能数据缓存
  const performanceHistory = ref<PerformanceMetrics[]>([]);
  const maxHistoryLength = 50; // 增加到50条记录用于更好的趋势分析

  // 性能警报系统
  const performanceAlerts = ref<PerformanceAlert[]>([]);
  const maxAlerts = 10;

    // 桌面端性能指标计算
  const performanceMetrics = computed<PerformanceMetrics>(() => {
    const memoryData = memory.memory.value;
    const now = Date.now();

    return {
      // 内存使用情况（桌面端阈值更高）
      memoryUsage: memoryData?.usedJSHeapSize || 0,
      memoryLimit: memoryData?.jsHeapSizeLimit || 0,
      memoryUsagePercent: memoryData ?
        ((memoryData.usedJSHeapSize / memoryData.jsHeapSizeLimit) * 100).toFixed(2) : '0',

      // 桌面端低性能检测（阈值：512MB内存使用或80%内存占用）
      isLowPerformance: (memoryData?.usedJSHeapSize || 0) > 512 * 1024 * 1024 ||
                       (memoryData ? (memoryData.usedJSHeapSize / memoryData.jsHeapSizeLimit) > 0.8 : false),

      // 屏幕信息
      screenSize: { width: width.value, height: height.value },
      isLargeScreen: width.value >= 1920 && height.value >= 1080,
      isUltraWide: width.value / height.value >= 2.1,

      // 状态信息
      isVisible: documentVisibility.value === 'visible',
      networkStatus: isOnline.value,
      isUserIdle: idle.value,
      isFullscreenMode: isFullscreen.value,

      // 时间戳
      timestamp: now
    };
  });

  // 性能数据记录
  const recordPerformance = (): void => {
    const metrics = performanceMetrics.value;
    performanceHistory.value.unshift(metrics);

    // 限制历史记录长度
    if (performanceHistory.value.length > maxHistoryLength) {
      performanceHistory.value = performanceHistory.value.slice(0, maxHistoryLength);
    }

    // 检查性能警报
    checkPerformanceAlerts(metrics);

    logger.info('Performance metrics recorded', {
      memoryUsage: metrics.memoryUsage,
      memoryPercent: metrics.memoryUsagePercent,
      isLowPerformance: metrics.isLowPerformance
    });
  };

  // 性能趋势分析
  const performanceTrends = computed<PerformanceTrends | null>(() => {
    if (performanceHistory.value.length < 3) return null;

    const recent = performanceHistory.value.slice(0, 10); // 分析最近10次记录
    const avgMemoryUsage = recent.reduce((sum, item) => sum + item.memoryUsage, 0) / recent.length;
    const memoryTrend = recent.length > 1 ?
      (recent[0].memoryUsage - recent[recent.length - 1].memoryUsage) > 0 ? 'increasing' : 'decreasing' : 'stable';

    return {
      avgMemoryUsage,
      memoryTrend,
      performanceScore: calculatePerformanceScore(recent),
      recommendations: generateRecommendations(recent)
    };
  });

  // 性能评分计算（0-100分）
  const calculatePerformanceScore = (data: PerformanceMetrics[]): number => {
    if (!data.length) return 100;

    const latest = data[0];
    let score = 100;

    // 内存使用率影响（-40分）
    const memoryPercent = parseFloat(latest.memoryUsagePercent);
    if (memoryPercent > 85) score -= 50;
    else if (memoryPercent > 75) score -= 35;
    else if (memoryPercent > 60) score -= 20;
    else if (memoryPercent > 40) score -= 10;

    // 网络状态影响（-20分）
    if (!latest.networkStatus) score -= 20;

    // 页面可见性影响（-10分）
    if (!latest.isVisible) score -= 10;

    // 屏幕尺寸优化加分
    if (latest.isLargeScreen) score += 10;
    if (latest.isUltraWide) score += 5;

    // 内存趋势影响
    if (data.length >= 5) {
      const trend = data.slice(0, 5);
      const isIncreasing = trend[0].memoryUsage > trend[4].memoryUsage;
      if (isIncreasing) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  };

  // 性能优化建议生成
  const generateRecommendations = (data: PerformanceMetrics[]): PerformanceRecommendation[] => {
    if (!data.length) return [];

    const latest = data[0];
    const recommendations: PerformanceRecommendation[] = [];

    if (latest.isLowPerformance) {
      recommendations.push({
        type: 'warning',
        message: '检测到高内存使用，建议关闭不必要的功能或减少动画效果',
        action: 'disable-animations',
        severity: 'high'
      });
    }

    if (!latest.networkStatus) {
      recommendations.push({
        type: 'info',
        message: '网络连接异常，已切换到离线模式',
        action: 'offline-mode',
        severity: 'medium'
      });
    }

    if (latest.isUserIdle) {
      recommendations.push({
        type: 'info',
        message: '检测到用户空闲，可以执行后台优化任务',
        action: 'background-optimization',
        severity: 'low'
      });
    }

    if (!latest.isLargeScreen && latest.screenSize.width < 1366) {
      recommendations.push({
        type: 'info',
        message: '当前屏幕分辨率较低，建议调整界面布局',
        action: 'optimize-layout',
        severity: 'low'
      });
    }

    return recommendations;
  };

  // 性能警报检查
  const checkPerformanceAlerts = (metrics: PerformanceMetrics): void => {
    const memoryPercent = parseFloat(metrics.memoryUsagePercent);

    // 内存使用过高警报
    if (memoryPercent > 90) {
      addPerformanceAlert({
        type: 'critical',
        title: '内存使用严重过高',
        message: `当前内存使用率达到 ${metrics.memoryUsagePercent}%，建议立即关闭不必要的功能`,
        actions: [
          { label: '禁用动画', action: 'disable-animations' },
          { label: '清理缓存', action: 'clear-cache' }
        ]
      });
    } else if (memoryPercent > 80) {
      addPerformanceAlert({
        type: 'warning',
        title: '内存使用过高',
        message: `当前内存使用率达到 ${metrics.memoryUsagePercent}%，建议进行性能优化`,
        actions: [
          { label: '启用性能模式', action: 'performance-mode' }
        ]
      });
    }

    // 网络断开警报
    if (!metrics.networkStatus) {
      addPerformanceAlert({
        type: 'warning',
        title: '网络连接断开',
        message: '当前网络不可用，部分功能可能受限',
        actions: [
          { label: '进入离线模式', action: 'offline-mode' }
        ]
      });
    }
  };

  // 添加性能警报
  const addPerformanceAlert = (alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'dismissed'>): void => {
    const newAlert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      dismissed: false,
      ...alert
    };

    // 检查是否已存在相同类型的警报
    const existingAlert = performanceAlerts.value.find(a =>
      a.title === newAlert.title && !a.dismissed
    );

    if (!existingAlert) {
      performanceAlerts.value.unshift(newAlert);

      // 限制警报数量
      if (performanceAlerts.value.length > maxAlerts) {
        performanceAlerts.value = performanceAlerts.value.slice(0, maxAlerts);
      }

      logger.warn(`Performance alert: ${newAlert.title}`, newAlert);
    }
  };

  // 关闭性能警报
  const dismissAlert = (alertId: string): void => {
    const alert = performanceAlerts.value.find(a => a.id === alertId);
    if (alert) {
      alert.dismissed = true;
    }
  };

  // 自动性能优化
  const autoOptimization = ref<AutoOptimization>({
    animationsDisabled: false,
    reducedMotion: false,
    backgroundProcessingPaused: false,
    lastOptimizationTime: 0
  });

  // 应用性能优化
  const applyOptimization = (type: string): void => {
    switch (type) {
      case 'disable-animations':
        autoOptimization.value.animationsDisabled = true;
        document.body.classList.add('performance-mode');
        logger.info('🎯 桌面端性能优化：已禁用复杂动画');
        break;

      case 'performance-mode':
        autoOptimization.value.animationsDisabled = true;
        autoOptimization.value.reducedMotion = true;
        document.body.classList.add('performance-mode', 'reduced-motion');
        logger.info('⚡ 桌面端性能优化：已启用性能模式');
        break;

      case 'offline-mode':
        // 触发离线模式
        window.dispatchEvent(new CustomEvent('performance:offline-mode'));
        logger.info('🌐 桌面端性能优化：已启用离线模式');
        break;

      case 'background-optimization':
        autoOptimization.value.backgroundProcessingPaused = true;
        logger.info('⏸️ 桌面端性能优化：已暂停后台处理');
        break;

      case 'clear-cache':
        // 清理性能缓存
        performanceHistory.value = performanceHistory.value.slice(0, 10);
        logger.info('🧹 桌面端性能优化：已清理性能缓存');
        break;

      default:
        logger.warn('❓ 未知的优化类型:', type);
    }

    autoOptimization.value.lastOptimizationTime = Date.now();
  };

  // 恢复性能优化
  const revertOptimization = (type: string): void => {
    switch (type) {
      case 'disable-animations':
        autoOptimization.value.animationsDisabled = false;
        document.body.classList.remove('performance-mode');
        logger.info('🎯 已恢复动画效果');
        break;

      case 'performance-mode':
        autoOptimization.value.animationsDisabled = false;
        autoOptimization.value.reducedMotion = false;
        document.body.classList.remove('performance-mode', 'reduced-motion');
        logger.info('⚡ 已退出性能模式');
        break;

      case 'background-optimization':
        autoOptimization.value.backgroundProcessingPaused = false;
        logger.info('▶️ 已恢复后台处理');
        break;
    }
  };

  // 监听性能变化并自动优化
  watch(() => performanceMetrics.value.isLowPerformance, (isLow, wasLow) => {
    if (isLow && !wasLow && !autoOptimization.value.animationsDisabled) {
      applyOptimization('disable-animations');
    } else if (!isLow && wasLow && autoOptimization.value.animationsDisabled) {
      revertOptimization('disable-animations');
    }
  });

  // 监听网络状态变化
  watch(isOnline, (online, wasOnline) => {
    if (!online && wasOnline) {
      applyOptimization('offline-mode');
    }
  });

  // 监听用户空闲状态
  watch(idle, (isIdle, wasIdle) => {
    if (isIdle && !wasIdle && !autoOptimization.value.backgroundProcessingPaused) {
      applyOptimization('background-optimization');
    } else if (!isIdle && wasIdle && autoOptimization.value.backgroundProcessingPaused) {
      revertOptimization('background-optimization');
    }
  });

  // Electron特定功能
  const electronFeatures = computed<ElectronFeatures>(() => ({
    isElectron: !!window.electronAPI,
    canMinimize: !!window.electronAPI?.minimize,
    canMaximize: !!window.electronAPI?.maximize,
    canToggleFullscreen: !!window.electronAPI?.toggleFullscreen
  }));

  // 实时性能追踪间隔
  const trackingInterval = ref<NodeJS.Timeout | null>(null);

  // 启动实时性能追踪
  const startRealTimeTracking = (intervalMs: number = 10000): void => {
    if (trackingInterval.value) {
      clearInterval(trackingInterval.value);
    }

    trackingInterval.value = setInterval(() => {
      recordPerformance();
    }, intervalMs);

    logger.info(`🔄 已启动实时性能追踪，间隔: ${intervalMs}ms`);
  };

  // 停止实时性能追踪
  const stopRealTimeTracking = (): void => {
    if (trackingInterval.value) {
      clearInterval(trackingInterval.value);
      trackingInterval.value = null;
      logger.info('⏹️ 已停止实时性能追踪');
    }
  };

  // 导出性能数据
  const exportPerformanceData = (): string => {
    const data = {
      metrics: performanceMetrics.value,
      history: performanceHistory.value,
      trends: performanceTrends.value,
      alerts: performanceAlerts.value,
      optimization: autoOptimization.value,
      exportTime: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  };

  // 初始化性能监控
  onMounted(() => {
    // 立即记录一次性能数据
    recordPerformance();

    // 启动实时追踪（每30秒记录一次）
    startRealTimeTracking(30000);

    // 监听窗口大小变化
    useEventListener('resize', () => {
      setTimeout(recordPerformance, 100); // 延迟记录以避免频繁触发
    });

    // 监听页面可见性变化
    useEventListener(document, 'visibilitychange', () => {
      recordPerformance();
    });

    logger.info('🚀 桌面端性能监控系统已初始化');

    // 组件销毁时清理
    return () => {
      stopRealTimeTracking();
    };
  });

  return {
    // 核心性能数据
    performanceMetrics: readonly(performanceMetrics),
    performanceHistory: readonly(computed(() => performanceHistory.value)),
    performanceTrends: readonly(performanceTrends),

    // 性能警报系统
    performanceAlerts: readonly(computed(() => performanceAlerts.value)),
    dismissAlert,

    // 原始监控数据
    memory: readonly(memory),
    screenSize: readonly(computed(() => ({ width: width.value, height: height.value }))),
    isOnline: readonly(isOnline),
    documentVisibility: readonly(documentVisibility),
    isUserIdle: readonly(idle),
    isFullscreen: readonly(isFullscreen),

    // 优化状态
    autoOptimization: readonly(computed(() => autoOptimization.value)),

    // 方法
    applyOptimization,
    revertOptimization,
    recordPerformance,
    startRealTimeTracking,
    stopRealTimeTracking,
    exportPerformanceData,

    // Electron特性
    electronFeatures: readonly(electronFeatures)
  };
}
