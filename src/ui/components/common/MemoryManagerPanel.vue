<!--
  内存管理面板
  可视化内存使用情况和提供内存清理工具
-->
<template>
  <div class="memory-manager-panel" :class="{ 'compact': isCompact }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-left">
        <span class="panel-icon">🧠</span>
        <h3 class="panel-title">内存管理</h3>
        <div class="memory-status" :class="getMemoryStatusClass(memoryStats.usagePercent)">
          <span class="status-dot"></span>
          <span class="status-text">{{ getMemoryStatusText(memoryStats.usagePercent) }}</span>
        </div>
      </div>

      <div class="header-controls">
        <button
          @click="performEmergencyCleanup"
          class="control-btn cleanup-btn"
          :disabled="isCleaningUp"
          title="紧急清理"
        >
          {{ isCleaningUp ? '⏳' : '🧹' }}
        </button>

        <button
          @click="refreshMemoryStats"
          class="control-btn refresh-btn"
          title="刷新统计"
        >
          🔄
        </button>

        <button
          @click="isCompact = !isCompact"
          class="control-btn toggle-btn"
          title="切换紧凑模式"
        >
          {{ isCompact ? '📊' : '📋' }}
        </button>
      </div>
    </div>

    <!-- 内存警告 -->
    <div v-if="activeWarnings.length > 0" class="warnings-section">
      <h4 class="section-title">
        <span class="section-icon">⚠️</span>
        内存警告 ({{ activeWarnings.length }})
      </h4>

      <div class="warnings-list">
        <div
          v-for="warning in activeWarnings"
          :key="warning.id"
          class="warning-item"
          :class="warning.type"
        >
          <div class="warning-content">
            <div class="warning-header">
              <span class="warning-icon">{{ getWarningIcon(warning.type) }}</span>
              <span class="warning-message">{{ warning.message }}</span>
              <button @click="dismissWarning(warning.id)" class="dismiss-btn">×</button>
            </div>
            <div class="warning-details">
              <span class="detail-item">
                阈值: {{ warning.threshold }}%
              </span>
              <span class="detail-item">
                当前: {{ warning.currentUsage.toFixed(1) }}%
              </span>
              <span class="detail-item">
                {{ formatTime(Date.now() - warning.timestamp) }}前
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内存使用概览 -->
    <div class="memory-overview">
      <div class="memory-stats-card">
        <div class="stats-header">
          <span class="stats-icon">📊</span>
          <h4 class="stats-title">内存使用情况</h4>
        </div>

        <div class="memory-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${memoryStats.usagePercent}%` }"
              :class="getMemoryProgressClass(memoryStats.usagePercent)"
            ></div>
          </div>
          <div class="progress-text">
            <span class="usage-current">{{ formatBytes(memoryStats.usedJSHeapSize) }}</span>
            <span class="usage-separator">/</span>
            <span class="usage-limit">{{ formatBytes(memoryStats.jsHeapSizeLimit) }}</span>
            <span class="usage-percent">({{ memoryStats.usagePercent.toFixed(1) }}%)</span>
          </div>
        </div>

        <div class="memory-trend">
          <span class="trend-icon">{{ getTrendIcon(memoryStats.trend) }}</span>
          <span class="trend-text">{{ getTrendText(memoryStats.trend) }}</span>
          <span class="trend-time">{{ formatTime(Date.now() - memoryStats.lastMeasurement) }}前更新</span>
        </div>
      </div>
    </div>

    <!-- 详细统计 -->
    <div v-show="!isCompact" class="detailed-stats">

      <!-- 缓存统计 -->
      <div class="stats-group">
        <h4 class="group-title">
          <span class="group-icon">💾</span>
          缓存统计
        </h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">WeakMap缓存:</span>
            <span class="stat-value">{{ memoryUsageStats.caches.weakCaches }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">受管理缓存:</span>
            <span class="stat-value">{{ memoryUsageStats.caches.managedCaches }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">缓存项总数:</span>
            <span class="stat-value">{{ memoryUsageStats.caches.totalCacheItems }}</span>
          </div>
        </div>
      </div>

      <!-- 清理任务统计 -->
      <div class="stats-group">
        <h4 class="group-title">
          <span class="group-icon">🔧</span>
          清理任务
        </h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">注册任务:</span>
            <span class="stat-value">{{ memoryUsageStats.cleanup.totalTasks }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">活跃定时器:</span>
            <span class="stat-value">{{ memoryUsageStats.cleanup.activeTimers }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">事件监听器:</span>
            <span class="stat-value">{{ memoryUsageStats.cleanup.eventListeners }}</span>
          </div>
        </div>
      </div>

      <!-- 存储统计 -->
      <div class="stats-group">
        <h4 class="group-title">
          <span class="group-icon">💿</span>
          大型对象存储
        </h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">存储对象:</span>
            <span class="stat-value">{{ memoryUsageStats.storage.largeObjects }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总存储大小:</span>
            <span class="stat-value">{{ formatBytes(memoryUsageStats.storage.totalStorageSize) }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- 内存操作 -->
    <div class="memory-actions">
      <h4 class="section-title">
        <span class="section-icon">⚙️</span>
        内存操作
      </h4>

      <div class="action-buttons">
        <button
          @click="triggerGarbageCollection"
          class="action-btn gc-btn"
          :disabled="!canTriggerGC"
          title="触发垃圾回收"
        >
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">垃圾回收</span>
        </button>

        <button
          @click="clearAllCaches"
          class="action-btn cache-btn"
          title="清空所有缓存"
        >
          <span class="btn-icon">💾</span>
          <span class="btn-text">清空缓存</span>
        </button>

        <button
          @click="optimizeStorage"
          class="action-btn storage-btn"
          title="优化存储"
        >
          <span class="btn-icon">💿</span>
          <span class="btn-text">优化存储</span>
        </button>

        <button
          @click="exportMemoryReport"
          class="action-btn export-btn"
          title="导出内存报告"
        >
          <span class="btn-icon">📊</span>
          <span class="btn-text">导出报告</span>
        </button>
      </div>

      <div class="memory-tips">
        <div class="tip-item">
          <span class="tip-icon">💡</span>
          <span class="tip-text">定期清理缓存可以释放内存空间</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">⚡</span>
          <span class="tip-text">使用WeakMap和WeakSet可以自动管理引用</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🔄</span>
          <span class="tip-text">大型对象建议存储到持久化存储中</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMemoryManager } from '../../composables/useMemoryManager';

// 使用内存管理器
const {
  memoryStats,
  memoryUsageStats,
  memoryWarnings,
  performEmergencyCleanup,
  createManagedCache,
  setCacheItem,
  getCacheItem
} = useMemoryManager();

// 组件状态
const isCompact = ref(false);
const isCleaningUp = ref(false);

// 计算属性
const activeWarnings = computed(() =>
  memoryWarnings.value.filter(warning => !warning.resolved)
);

const canTriggerGC = computed(() =>
  typeof window !== 'undefined' && 'gc' in window
);

// 辅助方法
const getMemoryStatusClass = (percent: number): string => {
  if (percent >= 85) return 'critical';
  if (percent >= 70) return 'warning';
  if (percent >= 50) return 'caution';
  return 'good';
};

const getMemoryStatusText = (percent: number): string => {
  if (percent >= 85) return '危险';
  if (percent >= 70) return '警告';
  if (percent >= 50) return '注意';
  return '良好';
};

const getMemoryProgressClass = (percent: number): string => {
  if (percent >= 85) return 'progress-critical';
  if (percent >= 70) return 'progress-warning';
  if (percent >= 50) return 'progress-caution';
  return 'progress-good';
};

const getWarningIcon = (type: string): string => {
  switch (type) {
    case 'critical': return '🔴';
    case 'warning': return '🟡';
    default: return '⚠️';
  }
};

const getTrendIcon = (trend: string): string => {
  switch (trend) {
    case 'increasing': return '📈';
    case 'decreasing': return '📉';
    default: return '➡️';
  }
};

const getTrendText = (trend: string): string => {
  switch (trend) {
    case 'increasing': return '上升';
    case 'decreasing': return '下降';
    default: return '稳定';
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (ms: number): string => {
  if (ms < 1000) return '刚刚';
  if (ms < 60000) return `${Math.floor(ms / 1000)}秒`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}分钟`;
  return `${Math.floor(ms / 3600000)}小时`;
};

// 操作方法
const refreshMemoryStats = (): void => {
  // 触发内存统计更新
  if ('memory' in performance) {
    console.log('刷新内存统计');
  }
};

const dismissWarning = (warningId: string): void => {
  const warning = memoryWarnings.value.find(w => w.id === warningId);
  if (warning) {
    warning.resolved = true;
  }
};

const triggerGarbageCollection = (): void => {
  if (window.gc) {
    window.gc();
    console.log('手动触发垃圾回收');
  }
};

const clearAllCaches = (): void => {
  // 这里应该调用内存管理器的清空缓存方法
  console.log('清空所有缓存');

  // 示例：清空localStorage中的缓存
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('cache_') || key.startsWith('temp_')) {
      localStorage.removeItem(key);
    }
  });
};

const optimizeStorage = (): void => {
  console.log('优化存储');

  // 清理旧的大型对象
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('large_object_')) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data.timestamp && (now - data.timestamp) > dayMs) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // 删除损坏的项
        localStorage.removeItem(key);
      }
    }
  });
};

const exportMemoryReport = (): void => {
  const report = {
    timestamp: new Date().toISOString(),
    memoryStats: memoryStats.value,
    usageStats: memoryUsageStats.value,
    warnings: memoryWarnings.value,
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform
    }
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `memory-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('内存报告已导出');
};

const handleEmergencyCleanup = async (): Promise<void> => {
  isCleaningUp.value = true;
  try {
    await performEmergencyCleanup();
    console.log('紧急清理完成');
  } catch (error) {
    console.error('紧急清理失败:', error);
  } finally {
    isCleaningUp.value = false;
  }
};
</script>

<style scoped>
.memory-manager-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin: var(--space-4);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  max-width: 900px;
}

.memory-manager-panel.compact {
  padding: var(--space-3);
}

/* 面板头部 */
.panel-header {
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

.panel-icon {
  font-size: var(--font-size-xl);
}

.panel-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.memory-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.memory-status.good {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.memory-status.caution {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-info);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.memory-status.warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.memory-status.critical {
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
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  border-color: var(--color-brand-blue);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cleanup-btn {
  background: var(--color-error);
  color: white;
  border-color: var(--color-error);
}

.cleanup-btn:hover:not(:disabled) {
  background: var(--color-error-dark);
}

/* 警告区域 */
.warnings-section {
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

.warnings-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.warning-item {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border-left: 4px solid;
}

.warning-item.warning {
  border-left-color: var(--color-warning);
  background: rgba(245, 158, 11, 0.05);
}

.warning-item.critical {
  border-left-color: var(--color-error);
  background: rgba(239, 68, 68, 0.05);
}

.warning-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.warning-icon {
  font-size: var(--font-size-lg);
}

.warning-message {
  flex: 1;
  font-weight: var(--font-weight-medium);
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

.warning-details {
  display: flex;
  gap: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.detail-item {
  display: flex;
  align-items: center;
}

/* 内存概览 */
.memory-overview {
  margin-bottom: var(--space-6);
}

.memory-stats-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.stats-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.stats-icon {
  font-size: var(--font-size-xl);
}

.stats-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.memory-progress {
  margin-bottom: var(--space-3);
}

.progress-bar {
  height: 12px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-2);
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: all var(--transition-normal);
}

.progress-good {
  background: var(--color-success);
}

.progress-caution {
  background: var(--color-info);
}

.progress-warning {
  background: var(--color-warning);
}

.progress-critical {
  background: var(--color-error);
}

.progress-text {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
}

.usage-current {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.usage-separator {
  color: var(--color-text-secondary);
}

.usage-limit {
  color: var(--color-text-secondary);
}

.usage-percent {
  color: var(--color-text-secondary);
  margin-left: var(--space-2);
}

.memory-trend {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.trend-icon {
  font-size: var(--font-size-md);
}

.trend-text {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

/* 详细统计 */
.detailed-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.stats-group {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.group-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-3) 0;
}

.group-icon {
  font-size: var(--font-size-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
}

.stat-label {
  color: var(--color-text-secondary);
}

.stat-value {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

/* 内存操作 */
.memory-actions {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.action-btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  border-color: var(--color-brand-blue);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gc-btn {
  border-color: var(--color-success);
  color: var(--color-success);
}

.cache-btn {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.storage-btn {
  border-color: var(--color-info);
  color: var(--color-info);
}

.export-btn {
  border-color: var(--color-brand-blue);
  color: var(--color-brand-blue);
}

.btn-icon {
  font-size: var(--font-size-md);
}

.btn-text {
  font-weight: var(--font-weight-medium);
}

.memory-tips {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-secondary);
}

.tip-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.tip-icon {
  font-size: var(--font-size-md);
}

.tip-text {
  line-height: var(--line-height-relaxed);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .memory-manager-panel {
    margin: var(--space-2);
    padding: var(--space-3);
  }

  .panel-header {
    flex-direction: column;
    gap: var(--space-3);
    align-items: stretch;
  }

  .warning-details {
    flex-direction: column;
    gap: var(--space-1);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    grid-template-columns: 1fr;
  }

  .progress-text {
    flex-wrap: wrap;
  }
}
</style>
