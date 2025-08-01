<!--
  桌面端性能监控指示器组件
  使用 @vueuse/core 13.6 新特性实现
-->
<template>
  <div v-if="showIndicator" class="performance-indicator" :class="indicatorClass">
    <div class="performance-header">
      <span class="performance-icon">🖥️</span>
      <h4 class="performance-title">桌面端性能监控</h4>
      <button 
        class="toggle-details" 
        @click="showDetails = !showDetails"
        :aria-expanded="showDetails"
      >
        {{ showDetails ? '隐藏' : '详情' }}
      </button>
    </div>

    <!-- 性能概览 -->
    <div class="performance-overview">
      <div class="metric-item">
        <span class="metric-label">性能评分</span>
        <span class="metric-value" :class="getScoreClass(performanceScore)">
          {{ performanceScore }}/100
        </span>
      </div>
      
      <div class="metric-item">
        <span class="metric-label">内存使用</span>
        <span class="metric-value">
          {{ formatBytes(performanceMetrics.memoryUsage) }}
        </span>
      </div>

      <div class="metric-item">
        <span class="metric-label">屏幕分辨率</span>
        <span class="metric-value">
          {{ screenSize.width }}×{{ screenSize.height }}
          <span v-if="performanceMetrics.isLargeScreen" class="badge">大屏</span>
          <span v-if="performanceMetrics.isUltraWide" class="badge">超宽</span>
        </span>
      </div>
    </div>

    <!-- 详细信息面板 -->
    <Transition name="details">
      <div v-if="showDetails" class="performance-details">
        <!-- 性能趋势 -->
        <div v-if="performanceTrends" class="trend-section">
          <h5>性能趋势</h5>
          <div class="trend-item">
            <span>内存趋势：</span>
            <span :class="getTrendClass(performanceTrends.memoryTrend)">
              {{ getTrendText(performanceTrends.memoryTrend) }}
            </span>
          </div>
          <div class="trend-item">
            <span>平均内存使用：</span>
            <span>{{ formatBytes(performanceTrends.avgMemoryUsage) }}</span>
          </div>
        </div>

        <!-- 优化建议 -->
        <div v-if="recommendations.length" class="recommendations-section">
          <h5>优化建议</h5>
          <div 
            v-for="(rec, index) in recommendations" 
            :key="index"
            class="recommendation-item"
            :class="rec.type"
          >
            <span class="rec-icon">
              {{ rec.type === 'warning' ? '⚠️' : 'ℹ️' }}
            </span>
            <span class="rec-message">{{ rec.message }}</span>
          </div>
        </div>

        <!-- 系统状态 -->
        <div class="system-status">
          <h5>系统状态</h5>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">网络状态</span>
              <span class="status-indicator" :class="{ online: isOnline, offline: !isOnline }">
                {{ isOnline ? '在线' : '离线' }}
              </span>
            </div>
            
            <div class="status-item">
              <span class="status-label">窗口状态</span>
              <span class="status-indicator">
                {{ documentVisibility === 'visible' ? '活跃' : '后台' }}
              </span>
            </div>
            
            <div class="status-item">
              <span class="status-label">用户状态</span>
              <span class="status-indicator">
                {{ isUserIdle ? '空闲' : '活跃' }}
              </span>
            </div>

            <div v-if="electronFeatures.isElectron" class="status-item">
              <span class="status-label">Electron</span>
              <span class="status-indicator electron">
                已启用
              </span>
            </div>
          </div>
        </div>

        <!-- 优化状态 -->
        <div v-if="hasActiveOptimizations" class="optimization-status">
          <h5>当前优化</h5>
          <div v-if="autoOptimization.animationsDisabled" class="optimization-item">
            <span class="opt-icon">🎯</span>
            <span>动画优化已启用</span>
            <button @click="revertOptimization('disable-animations')" class="revert-btn">
              恢复
            </button>
          </div>
          
          <div v-if="autoOptimization.backgroundProcessingPaused" class="optimization-item">
            <span class="opt-icon">⏸️</span>
            <span>后台处理已暂停</span>
            <button @click="revertOptimization('background-optimization')" class="revert-btn">
              恢复
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useDesktopMonitoring } from '@/ui/composables/useDesktopMonitoring';

// 使用桌面端性能监控
const {
  performanceMetrics,
  performanceTrends,
  screenSize,
  isOnline,
  documentVisibility,
  isUserIdle,
  autoOptimization,
  electronFeatures,
  revertOptimization
} = useDesktopMonitoring();

// 组件状态
const showDetails = ref(false);

// 是否显示性能指示器（低性能或开发模式下显示）
const showIndicator = computed(() => 
  performanceMetrics.value.isLowPerformance || 
  import.meta.env.DEV ||
  showDetails.value
);

// 性能评分
const performanceScore = computed(() => 
  performanceTrends.value?.performanceScore || 100
);

// 优化建议
const recommendations = computed(() => 
  performanceTrends.value?.recommendations || []
);

// 指示器样式类
const indicatorClass = computed(() => ({
  'low-performance': performanceMetrics.value.isLowPerformance,
  'good-performance': performanceScore.value >= 80,
  'electron-mode': electronFeatures.value.isElectron
}));

// 是否有活跃的优化
const hasActiveOptimizations = computed(() => 
  autoOptimization.value.animationsDisabled || 
  autoOptimization.value.backgroundProcessingPaused
);

// 工具函数
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getScoreClass = (score) => ({
  'score-excellent': score >= 90,
  'score-good': score >= 70 && score < 90,
  'score-fair': score >= 50 && score < 70,
  'score-poor': score < 50
});

const getTrendClass = (trend) => ({
  'trend-increasing': trend === 'increasing',
  'trend-decreasing': trend === 'decreasing',
  'trend-stable': trend === 'stable'
});

const getTrendText = (trend) => {
  const texts = {
    increasing: '上升 ↗️',
    decreasing: '下降 ↘️',
    stable: '稳定 ➡️'
  };
  return texts[trend] || '未知';
};
</script>

<style scoped>
.performance-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px;
  font-size: 13px;
  z-index: 9999;
  transition: all 0.3s ease;
}

.performance-indicator.low-performance {
  border-left: 4px solid #e74c3c;
  background: rgba(255, 242, 242, 0.95);
}

.performance-indicator.good-performance {
  border-left: 4px solid #27ae60;
}

.performance-indicator.electron-mode {
  border-top: 2px solid #4a90e2;
}

.performance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.performance-icon {
  font-size: 16px;
  margin-right: 8px;
}

.performance-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
  flex: 1;
}

.toggle-details {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-details:hover {
  background: #e9ecef;
}

.performance-overview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #eee;
}

.metric-label {
  font-weight: 500;
  color: #6c757d;
}

.metric-value {
  font-weight: 600;
  color: #495057;
}

.badge {
  font-size: 10px;
  background: #007bff;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
}

/* 评分颜色 */
.score-excellent { color: #27ae60; }
.score-good { color: #f39c12; }
.score-fair { color: #e67e22; }
.score-poor { color: #e74c3c; }

/* 趋势颜色 */
.trend-increasing { color: #e74c3c; }
.trend-decreasing { color: #27ae60; }
.trend-stable { color: #95a5a6; }

/* 详细信息面板 */
.performance-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.performance-details h5 {
  font-size: 12px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #495057;
}

.trend-section,
.recommendations-section,
.system-status,
.optimization-status {
  margin-bottom: 16px;
}

.trend-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 6px;
}

.recommendation-item.warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
}

.recommendation-item.info {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
}

.rec-message {
  font-size: 12px;
  flex: 1;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-label {
  font-size: 11px;
  color: #6c757d;
}

.status-indicator {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
}

.status-indicator.online {
  background: #d4edda;
  color: #155724;
}

.status-indicator.offline {
  background: #f8d7da;
  color: #721c24;
}

.status-indicator.electron {
  background: #d1ecf1;
  color: #0c5460;
}

.optimization-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: #e2f3ff;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 12px;
}

.revert-btn {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 10px;
  cursor: pointer;
  margin-left: auto;
}

.revert-btn:hover {
  background: #5a6268;
}

/* 动画效果 */
.details-enter-active,
.details-leave-active {
  transition: all 0.3s ease;
}

.details-enter-from,
.details-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .performance-indicator {
    width: calc(100vw - 40px);
    right: 20px;
  }
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .performance-indicator {
    background: rgba(33, 37, 41, 0.95);
    color: #f8f9fa;
  }
  
  .performance-title {
    color: #f8f9fa;
  }
  
  .toggle-details {
    background: #495057;
    border-color: #6c757d;
    color: #f8f9fa;
  }
  
  .toggle-details:hover {
    background: #5a6268;
  }
}
</style>