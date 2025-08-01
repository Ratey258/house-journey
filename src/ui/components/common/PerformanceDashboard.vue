<!--
  完整性能监控Dashboard
  实时性能指标追踪 + 性能预警机制 + 性能监控Dashboard
-->
<template>
  <div class="performance-dashboard" :class="{ 'minimized': isMinimized }">
    <!-- Dashboard 头部 -->
    <div class="dashboard-header">
      <div class="header-left">
        <span class="dashboard-icon">📊</span>
        <h3 class="dashboard-title">性能监控中心</h3>
        <div class="status-indicator" :class="getStatusClass(performanceScore)">
          <span class="status-dot"></span>
          <span class="status-text">{{ getStatusText(performanceScore) }}</span>
        </div>
      </div>

      <div class="header-controls">
        <button
          @click="toggleRealTimeTracking"
          class="control-btn"
          :class="{ 'active': isRealTimeTracking }"
          title="实时追踪"
        >
          {{ isRealTimeTracking ? '⏸️' : '▶️' }}
        </button>

        <button
          @click="exportData"
          class="control-btn"
          title="导出数据"
        >
          💾
        </button>

        <button
          @click="refreshData"
          class="control-btn"
          title="刷新数据"
        >
          🔄
        </button>

        <button
          @click="isMinimized = !isMinimized"
          class="control-btn"
          title="最小化"
        >
          {{ isMinimized ? '📈' : '📉' }}
        </button>
      </div>
    </div>

    <!-- Dashboard 内容 -->
    <div v-show="!isMinimized" class="dashboard-content">

      <!-- 性能警报区域 -->
      <div v-if="activeAlerts.length > 0" class="alerts-section">
        <h4 class="section-title">
          <span class="section-icon">🚨</span>
          性能警报 ({{ activeAlerts.length }})
        </h4>

        <div class="alerts-list">
          <div
            v-for="alert in activeAlerts"
            :key="alert.id"
            class="alert-item"
            :class="alert.type"
          >
            <div class="alert-content">
              <div class="alert-header">
                <span class="alert-icon">{{ getAlertIcon(alert.type) }}</span>
                <strong class="alert-title">{{ alert.title }}</strong>
                <button @click="dismissAlert(alert.id)" class="dismiss-btn">×</button>
              </div>
              <p class="alert-message">{{ alert.message }}</p>

              <div v-if="alert.actions" class="alert-actions">
                <button
                  v-for="action in alert.actions"
                  :key="action.action"
                  @click="applyOptimization(action.action)"
                  class="action-btn"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 核心指标卡片 -->
      <div class="metrics-grid">
        <!-- 性能评分 -->
        <div class="metric-card score-card">
          <div class="metric-header">
            <span class="metric-icon">🎯</span>
            <h4 class="metric-title">性能评分</h4>
          </div>
          <div class="metric-value">
            <div class="score-display" :class="getScoreClass(performanceScore)">
              <span class="score-number">{{ performanceScore }}</span>
              <span class="score-unit">/100</span>
            </div>
            <div class="score-trend">
              <span class="trend-icon">{{ getScoreTrend() }}</span>
              <span class="trend-text">{{ getScoreTrendText() }}</span>
            </div>
          </div>
        </div>

        <!-- 内存使用 -->
        <div class="metric-card memory-card">
          <div class="metric-header">
            <span class="metric-icon">🧠</span>
            <h4 class="metric-title">内存使用</h4>
          </div>
          <div class="metric-value">
            <div class="memory-usage">
              <div class="usage-bar">
                <div
                  class="usage-fill"
                  :style="{ width: `${performanceMetrics.memoryUsagePercent}%` }"
                  :class="getMemoryClass(parseFloat(performanceMetrics.memoryUsagePercent))"
                ></div>
              </div>
              <div class="usage-text">
                <span class="usage-current">{{ formatBytes(performanceMetrics.memoryUsage) }}</span>
                <span class="usage-percent">{{ performanceMetrics.memoryUsagePercent }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 系统状态 -->
        <div class="metric-card system-card">
          <div class="metric-header">
            <span class="metric-icon">💻</span>
            <h4 class="metric-title">系统状态</h4>
          </div>
          <div class="metric-value">
            <div class="system-status">
              <div class="status-item">
                <span class="status-label">网络:</span>
                <span class="status-value" :class="{ 'online': isOnline, 'offline': !isOnline }">
                  {{ isOnline ? '在线' : '离线' }}
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">屏幕:</span>
                <span class="status-value">
                  {{ screenSize.width }}×{{ screenSize.height }}
                  <span v-if="performanceMetrics.isLargeScreen" class="badge">大屏</span>
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">状态:</span>
                <span class="status-value">
                  {{ performanceMetrics.isVisible ? '活跃' : '后台' }}
                  {{ performanceMetrics.isUserIdle ? ' (空闲)' : '' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 性能趋势图 -->
      <div class="trends-section">
        <div class="section-header">
          <h4 class="section-title">
            <span class="section-icon">📈</span>
            性能趋势
          </h4>
          <div class="trend-controls">
            <select v-model="selectedTrendPeriod" class="trend-period-select">
              <option value="10">最近10次</option>
              <option value="20">最近20次</option>
              <option value="50">最近50次</option>
            </select>
          </div>
        </div>

        <div class="trend-chart">
          <canvas ref="chartCanvas" width="800" height="200"></canvas>
        </div>

        <div v-if="performanceTrends" class="trend-summary">
          <div class="summary-item">
            <span class="summary-label">平均内存:</span>
            <span class="summary-value">{{ formatBytes(performanceTrends.avgMemoryUsage) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">内存趋势:</span>
            <span class="summary-value" :class="performanceTrends.memoryTrend">
              {{ getTrendText(performanceTrends.memoryTrend) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 优化建议 -->
      <div v-if="performanceTrends?.recommendations.length" class="recommendations-section">
        <h4 class="section-title">
          <span class="section-icon">💡</span>
          优化建议
        </h4>

        <div class="recommendations-list">
          <div
            v-for="(rec, index) in performanceTrends.recommendations"
            :key="index"
            class="recommendation-item"
            :class="rec.type"
          >
            <span class="rec-icon">{{ getRecommendationIcon(rec.type) }}</span>
            <span class="rec-message">{{ rec.message }}</span>
            <button
              @click="applyOptimization(rec.action)"
              class="rec-action-btn"
            >
              应用
            </button>
          </div>
        </div>
      </div>

      <!-- 性能优化控制面板 -->
      <div class="optimization-panel">
        <h4 class="section-title">
          <span class="section-icon">⚙️</span>
          优化控制
        </h4>

        <div class="optimization-controls">
          <div class="control-group">
            <label class="control-label">
              <input
                type="checkbox"
                :checked="autoOptimization.animationsDisabled"
                @change="toggleOptimization('disable-animations')"
              >
              禁用动画效果
            </label>
          </div>

          <div class="control-group">
            <label class="control-label">
              <input
                type="checkbox"
                :checked="autoOptimization.reducedMotion"
                @change="toggleOptimization('performance-mode')"
              >
              性能模式
            </label>
          </div>

          <div class="control-group">
            <label class="control-label">
              <input
                type="checkbox"
                :checked="autoOptimization.backgroundProcessingPaused"
                @change="toggleOptimization('background-optimization')"
              >
              暂停后台处理
            </label>
          </div>
        </div>

        <div class="optimization-actions">
          <button @click="applyOptimization('clear-cache')" class="action-btn">
            清理缓存
          </button>
          <button @click="revertAllOptimizations" class="action-btn secondary">
            恢复默认
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue';
import { useDesktopMonitoring } from '../../composables/useDesktopMonitoring';
import { useSmartLogger } from '../../../infrastructure/utils/smartLogger';

// 使用性能监控
const {
  performanceMetrics,
  performanceHistory,
  performanceTrends,
  performanceAlerts,
  dismissAlert,
  screenSize,
  isOnline,
  autoOptimization,
  applyOptimization,
  revertOptimization,
  startRealTimeTracking,
  stopRealTimeTracking,
  recordPerformance,
  exportPerformanceData
} = useDesktopMonitoring();

const logger = useSmartLogger();

// 组件状态
const isMinimized = ref(false);
const isRealTimeTracking = ref(true);
const selectedTrendPeriod = ref(20);
const chartCanvas = ref<HTMLCanvasElement | null>(null);

// 计算属性
const performanceScore = computed(() =>
  performanceTrends.value?.performanceScore || 100
);

const activeAlerts = computed(() =>
  performanceAlerts.value.filter(alert => !alert.dismissed)
);

// 状态获取方法
const getStatusClass = (score: number): string => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
};

const getStatusText = (score: number): string => {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '一般';
  return '较差';
};

const getScoreClass = (score: number): string => {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-fair';
  return 'score-poor';
};

const getMemoryClass = (percent: number): string => {
  if (percent >= 85) return 'memory-critical';
  if (percent >= 70) return 'memory-warning';
  return 'memory-normal';
};

const getAlertIcon = (type: string): string => {
  switch (type) {
    case 'critical': return '🔴';
    case 'warning': return '🟡';
    case 'info': return '🔵';
    default: return 'ℹ️';
  }
};

const getRecommendationIcon = (type: string): string => {
  switch (type) {
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    case 'success': return '✅';
    default: return '💡';
  }
};

const getScoreTrend = (): string => {
  if (!performanceHistory.value.length || performanceHistory.value.length < 2) return '➡️';

  const current = performanceTrends.value?.performanceScore || 0;
  const history = performanceHistory.value.slice(1, 6);

  if (history.length === 0) return '➡️';

  const avgPrev = history.reduce((sum, h) => {
    const trends = calculateTrendScore(h);
    return sum + trends;
  }, 0) / history.length;

  if (current > avgPrev + 5) return '📈';
  if (current < avgPrev - 5) return '📉';
  return '➡️';
};

const getScoreTrendText = (): string => {
  const trend = getScoreTrend();
  if (trend === '📈') return '上升';
  if (trend === '📉') return '下降';
  return '稳定';
};

const getTrendText = (trend: string): string => {
  switch (trend) {
    case 'increasing': return '上升';
    case 'decreasing': return '下降';
    default: return '稳定';
  }
};

// 辅助方法
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const calculateTrendScore = (metrics: any): number => {
  // 简化版性能评分计算
  let score = 100;
  const memoryPercent = parseFloat(metrics.memoryUsagePercent);
  if (memoryPercent > 80) score -= 40;
  else if (memoryPercent > 60) score -= 20;
  if (!metrics.networkStatus) score -= 20;
  return Math.max(0, score);
};

// 控制方法
const toggleRealTimeTracking = (): void => {
  if (isRealTimeTracking.value) {
    stopRealTimeTracking();
    isRealTimeTracking.value = false;
    logger.info('🔄 已停止实时性能追踪');
  } else {
    startRealTimeTracking(10000); // 10秒间隔
    isRealTimeTracking.value = true;
    logger.info('🔄 已启动实时性能追踪');
  }
};

const toggleOptimization = (type: string): void => {
  if (isOptimizationActive(type)) {
    revertOptimization(type);
  } else {
    applyOptimization(type);
  }
};

const isOptimizationActive = (type: string): boolean => {
  switch (type) {
    case 'disable-animations':
      return autoOptimization.value.animationsDisabled;
    case 'performance-mode':
      return autoOptimization.value.reducedMotion;
    case 'background-optimization':
      return autoOptimization.value.backgroundProcessingPaused;
    default:
      return false;
  }
};

const revertAllOptimizations = (): void => {
  revertOptimization('disable-animations');
  revertOptimization('performance-mode');
  revertOptimization('background-optimization');
  logger.info('🔄 已恢复所有优化设置');
};

const refreshData = (): void => {
  recordPerformance();
  logger.info('🔄 已刷新性能数据');
};

const exportData = (): void => {
  try {
    const data = exportPerformanceData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logger.info('💾 性能数据已导出');
  } catch (error) {
    logger.error('导出性能数据失败:', error);
  }
};

// 绘制性能趋势图
const drawTrendChart = (): void => {
  if (!chartCanvas.value) return;

  const canvas = chartCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const history = performanceHistory.value.slice(0, selectedTrendPeriod.value);
  if (history.length < 2) return;

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制网格
  ctx.strokeStyle = 'var(--color-border-secondary)';
  ctx.lineWidth = 1;

  // 水平网格线
  for (let i = 0; i <= 4; i++) {
    const y = (canvas.height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 绘制内存使用曲线
  ctx.strokeStyle = 'var(--color-brand-blue)';
  ctx.lineWidth = 2;
  ctx.beginPath();

  history.reverse().forEach((metrics, index) => {
    const x = (canvas.width / (history.length - 1)) * index;
    const memoryPercent = parseFloat(metrics.memoryUsagePercent);
    const y = canvas.height - (canvas.height * (memoryPercent / 100));

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // 绘制性能评分曲线
  ctx.strokeStyle = 'var(--color-success)';
  ctx.beginPath();

  history.forEach((metrics, index) => {
    const x = (canvas.width / (history.length - 1)) * index;
    const score = calculateTrendScore(metrics);
    const y = canvas.height - (canvas.height * (score / 100));

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
};

// 监听趋势周期变化
watch(selectedTrendPeriod, () => {
  nextTick(drawTrendChart);
});

// 监听性能历史变化
watch(performanceHistory, () => {
  nextTick(drawTrendChart);
}, { deep: true });

// 组件挂载
onMounted(() => {
  // 启动实时追踪
  startRealTimeTracking(10000);

  // 绘制初始图表
  nextTick(drawTrendChart);

  logger.info('📊 性能监控Dashboard已启动');
});
</script>

<style scoped>
.performance-dashboard {
  background: var(--color-surface);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin: var(--space-4);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  max-width: 1200px;
}

.performance-dashboard.minimized {
  padding: var(--space-2);
}

/* Dashboard头部 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-secondary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dashboard-icon {
  font-size: var(--font-size-xl);
}

.dashboard-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.status-indicator.excellent {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-indicator.good {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-info);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-indicator.fair {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.status-indicator.poor {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.header-controls {
  display: flex;
  gap: var(--space-2);
}

.control-btn {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.control-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-brand-blue);
}

.control-btn.active {
  background: var(--color-brand-blue);
  color: white;
  border-color: var(--color-brand-blue);
}

/* 警报区域 */
.alerts-section {
  margin-bottom: var(--space-6);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-3) 0;
}

.section-icon {
  font-size: var(--font-size-lg);
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.alert-item {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  border-left: 4px solid;
}

.alert-item.critical {
  border-left-color: var(--color-error);
  background: rgba(239, 68, 68, 0.05);
}

.alert-item.warning {
  border-left-color: var(--color-warning);
  background: rgba(245, 158, 11, 0.05);
}

.alert-item.info {
  border-left-color: var(--color-info);
  background: rgba(59, 130, 246, 0.05);
}

.alert-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.alert-icon {
  font-size: var(--font-size-lg);
}

.alert-title {
  flex: 1;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.dismiss-btn {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}

.dismiss-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.alert-message {
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3) 0;
  line-height: var(--line-height-relaxed);
}

.alert-actions {
  display: flex;
  gap: var(--space-2);
}

.action-btn {
  background: var(--color-brand-blue);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-brand-blue-dark);
}

.action-btn.secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

.action-btn.secondary:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-brand-blue);
}

/* 指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.metric-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  transition: all var(--transition-normal);
}

.metric-card:hover {
  border-color: var(--color-brand-blue);
  box-shadow: var(--shadow-sm);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.metric-icon {
  font-size: var(--font-size-xl);
}

.metric-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.metric-value {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* 性能评分 */
.score-display {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.score-number {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
}

.score-unit {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

.score-excellent .score-number {
  color: var(--color-success);
}

.score-good .score-number {
  color: var(--color-info);
}

.score-fair .score-number {
  color: var(--color-warning);
}

.score-poor .score-number {
  color: var(--color-error);
}

.score-trend {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* 内存使用 */
.memory-usage {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.usage-bar {
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: all var(--transition-normal);
}

.memory-normal {
  background: var(--color-success);
}

.memory-warning {
  background: var(--color-warning);
}

.memory-critical {
  background: var(--color-error);
}

.usage-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
}

.usage-current {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.usage-percent {
  color: var(--color-text-secondary);
}

/* 系统状态 */
.system-status {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
}

.status-label {
  color: var(--color-text-secondary);
}

.status-value {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.status-value.online {
  color: var(--color-success);
}

.status-value.offline {
  color: var(--color-error);
}

.badge {
  background: var(--color-brand-blue);
  color: white;
  padding: 2px var(--space-1);
  border-radius: var(--radius-sm);
  font-size: 10px;
}

/* 趋势图 */
.trends-section {
  margin-bottom: var(--space-6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.trend-controls {
  display: flex;
  gap: var(--space-2);
}

.trend-period-select {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.trend-chart {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
}

.trend-chart canvas {
  width: 100%;
  height: 200px;
}

.trend-summary {
  display: flex;
  gap: var(--space-6);
  font-size: var(--font-size-sm);
}

.summary-item {
  display: flex;
  gap: var(--space-2);
}

.summary-label {
  color: var(--color-text-secondary);
}

.summary-value {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.summary-value.increasing {
  color: var(--color-error);
}

.summary-value.decreasing {
  color: var(--color-success);
}

/* 优化建议 */
.recommendations-section {
  margin-bottom: var(--space-6);
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}

.recommendation-item.warning {
  border-left: 4px solid var(--color-warning);
}

.recommendation-item.info {
  border-left: 4px solid var(--color-info);
}

.recommendation-item.success {
  border-left: 4px solid var(--color-success);
}

.rec-icon {
  font-size: var(--font-size-lg);
}

.rec-message {
  flex: 1;
  color: var(--color-text-primary);
}

.rec-action-btn {
  background: var(--color-brand-blue);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.rec-action-btn:hover {
  background: var(--color-brand-blue-dark);
}

/* 优化控制面板 */
.optimization-panel {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.optimization-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.control-group {
  display: flex;
  align-items: center;
}

.control-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.control-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.optimization-actions {
  display: flex;
  gap: var(--space-3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .performance-dashboard {
    margin: var(--space-2);
    padding: var(--space-3);
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    flex-direction: column;
    gap: var(--space-3);
    align-items: stretch;
  }

  .trend-summary {
    flex-direction: column;
    gap: var(--space-2);
  }

  .optimization-actions {
    flex-direction: column;
  }
}
</style>
