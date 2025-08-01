/**
 * 桌面端性能监控 Composable
 * 基于 @vueuse/core 13.6 实现
 * 专门针对桌面端（网页+Electron）优化
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
import { computed, ref, watch, onMounted } from 'vue';

export function useDesktopMonitoring() {
  // 桌面端性能监控核心API
  const memory = useMemory();
  const { width, height } = useWindowSize();
  const isOnline = useOnline();
  const documentVisibility = useDocumentVisibility();
  const { idle } = useIdle(5 * 60 * 1000); // 5分钟无操作视为空闲
  const { isFullscreen } = useFullscreen();

  // 性能数据缓存
  const performanceHistory = ref([]);
  const maxHistoryLength = 20; // 保存最近20次性能数据

  // 桌面端性能指标计算
  const performanceMetrics = computed(() => {
    const memoryData = memory.value;
    const now = Date.now();
    
    return {
      // 内存使用情况（桌面端阈值更高）
      memoryUsage: memoryData?.usedJSHeapSize || 0,
      memoryLimit: memoryData?.jsHeapSizeLimit || 0,
      memoryUsagePercent: memoryData ? 
        ((memoryData.usedJSHeapSize / memoryData.jsHeapSizeLimit) * 100).toFixed(2) : 0,
      
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
  const recordPerformance = () => {
    const metrics = performanceMetrics.value;
    performanceHistory.value.unshift(metrics);
    
    // 限制历史记录长度
    if (performanceHistory.value.length > maxHistoryLength) {
      performanceHistory.value = performanceHistory.value.slice(0, maxHistoryLength);
    }
  };

  // 性能趋势分析
  const performanceTrends = computed(() => {
    if (performanceHistory.value.length < 3) return null;
    
    const recent = performanceHistory.value.slice(0, 5);
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
  const calculatePerformanceScore = (data) => {
    if (!data.length) return 100;
    
    const latest = data[0];
    let score = 100;
    
    // 内存使用率影响（-40分）
    if (latest.memoryUsagePercent > 80) score -= 40;
    else if (latest.memoryUsagePercent > 60) score -= 20;
    else if (latest.memoryUsagePercent > 40) score -= 10;
    
    // 网络状态影响（-20分）
    if (!latest.networkStatus) score -= 20;
    
    // 屏幕尺寸优化加分
    if (latest.isLargeScreen) score += 10;
    if (latest.isUltraWide) score += 5;
    
    return Math.max(0, Math.min(100, score));
  };

  // 性能优化建议生成
  const generateRecommendations = (data) => {
    if (!data.length) return [];
    
    const latest = data[0];
    const recommendations = [];
    
    if (latest.isLowPerformance) {
      recommendations.push({
        type: 'warning',
        message: '检测到高内存使用，建议关闭不必要的功能',
        action: 'disable-animations'
      });
    }
    
    if (!latest.networkStatus) {
      recommendations.push({
        type: 'info',
        message: '网络连接异常，已切换到离线模式',
        action: 'offline-mode'
      });
    }
    
    if (latest.isUserIdle) {
      recommendations.push({
        type: 'info',
        message: '检测到用户空闲，可以执行后台优化',
        action: 'background-optimization'
      });
    }
    
    return recommendations;
  };

  // 自动性能优化
  const autoOptimization = ref({
    animationsDisabled: false,
    reducedMotion: false,
    backgroundProcessingPaused: false
  });

  // 应用性能优化
  const applyOptimization = (type) => {
    switch (type) {
      case 'disable-animations':
        autoOptimization.value.animationsDisabled = true;
        document.body.classList.add('performance-mode');
        console.log('🎯 桌面端性能优化：已禁用复杂动画');
        break;
        
      case 'offline-mode':
        // 触发离线模式
        window.dispatchEvent(new CustomEvent('performance:offline-mode'));
        console.log('🌐 桌面端性能优化：已启用离线模式');
        break;
        
      case 'background-optimization':
        autoOptimization.value.backgroundProcessingPaused = true;
        console.log('⏸️ 桌面端性能优化：已暂停后台处理');
        break;
        
      default:
        console.log('❓ 未知的优化类型:', type);
    }
  };

  // 恢复性能优化
  const revertOptimization = (type) => {
    switch (type) {
      case 'disable-animations':
        autoOptimization.value.animationsDisabled = false;
        document.body.classList.remove('performance-mode');
        break;
        
      case 'background-optimization':
        autoOptimization.value.backgroundProcessingPaused = false;
        break;
    }
  };

  // 监听性能变化并自动优化
  watch(() => performanceMetrics.value.isLowPerformance, (isLow) => {
    if (isLow && !autoOptimization.value.animationsDisabled) {
      applyOptimization('disable-animations');
    } else if (!isLow && autoOptimization.value.animationsDisabled) {
      revertOptimization('disable-animations');
    }
  });

  // 监听网络状态变化
  watch(isOnline, (online) => {
    if (!online) {
      applyOptimization('offline-mode');
    }
  });

  // 监听用户空闲状态
  watch(idle, (isIdle) => {
    if (isIdle && !autoOptimization.value.backgroundProcessingPaused) {
      applyOptimization('background-optimization');
    } else if (!isIdle && autoOptimization.value.backgroundProcessingPaused) {
      revertOptimization('background-optimization');
    }
  });

  // Electron特定功能
  const electronFeatures = computed(() => ({
    isElectron: !!window.electronAPI,
    canMinimize: !!window.electronAPI?.minimize,
    canMaximize: !!window.electronAPI?.maximize,
    canToggleFullscreen: !!window.electronAPI?.toggleFullscreen
  }));

  // 初始化性能监控
  onMounted(() => {
    // 立即记录一次性能数据
    recordPerformance();
    
    // 每30秒记录一次性能数据
    const performanceInterval = setInterval(recordPerformance, 30000);
    
    // 监听窗口大小变化
    useEventListener('resize', () => {
      setTimeout(recordPerformance, 100); // 延迟记录以避免频繁触发
    });
    
    // 组件销毁时清理
    return () => {
      clearInterval(performanceInterval);
    };
  });

  return {
    // 核心性能数据
    performanceMetrics,
    performanceHistory: computed(() => performanceHistory.value),
    performanceTrends,
    
    // 原始监控数据
    memory,
    screenSize: computed(() => ({ width: width.value, height: height.value })),
    isOnline,
    documentVisibility,
    isUserIdle: idle,
    isFullscreen,
    
    // 优化状态
    autoOptimization: computed(() => autoOptimization.value),
    
    // 方法
    applyOptimization,
    revertOptimization,
    recordPerformance,
    
    // Electron特性
    electronFeatures
  };
}