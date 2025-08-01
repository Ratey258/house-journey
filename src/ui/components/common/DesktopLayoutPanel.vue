<!--
  桌面端布局控制面板
  提供可视化的布局设置和屏幕适配控制
-->
<template>
  <div class="layout-panel" :class="{ 'compact': isCompact }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-left">
        <span class="panel-icon">🖥️</span>
        <h3 class="panel-title">桌面布局</h3>
        <div class="screen-indicator" :class="screenInfo.category">
          <span class="screen-icon">{{ getScreenIcon(screenInfo.category) }}</span>
          <span class="screen-text">{{ getScreenText(screenInfo.category) }}</span>
        </div>
      </div>

      <div class="header-controls">
        <button
          @click="applyOptimizedLayout"
          class="control-btn optimize-btn"
          title="应用优化布局"
        >
          ⚡
        </button>

        <button
          @click="resetLayout"
          class="control-btn reset-btn"
          title="重置布局"
        >
          🔄
        </button>

        <button
          @click="isCompact = !isCompact"
          class="control-btn toggle-btn"
          title="切换紧凑模式"
        >
          {{ isCompact ? '📋' : '📊' }}
        </button>
      </div>
    </div>

    <!-- 屏幕信息概览 -->
    <div class="screen-overview">
      <div class="screen-stats">
        <div class="stat-item">
          <span class="stat-label">分辨率:</span>
          <span class="stat-value">{{ screenInfo.width }}×{{ screenInfo.height }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">比例:</span>
          <span class="stat-value">{{ screenInfo.ratio.toFixed(2) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">类型:</span>
          <span class="stat-value">
            <span v-if="screenInfo.isUltraWide" class="badge ultra">超宽屏</span>
            <span v-else-if="screenInfo.isWidescreen" class="badge wide">宽屏</span>
            <span v-else class="badge normal">标准</span>
            <span v-if="screenInfo.is4K" class="badge k4">4K</span>
            <span v-if="screenInfo.isRetina" class="badge retina">Retina</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 布局建议 -->
    <div v-if="layoutSuggestions.length > 0" class="suggestions-section">
      <h4 class="section-title">
        <span class="section-icon">💡</span>
        布局建议
      </h4>

      <div class="suggestions-list">
        <div
          v-for="(suggestion, index) in layoutSuggestions"
          :key="index"
          class="suggestion-item"
          :class="[suggestion.type, suggestion.priority]"
        >
          <div class="suggestion-content">
            <div class="suggestion-header">
              <span class="suggestion-icon">{{ getSuggestionIcon(suggestion.type) }}</span>
              <strong class="suggestion-title">{{ suggestion.title }}</strong>
              <span class="priority-badge" :class="suggestion.priority">
                {{ getPriorityText(suggestion.priority) }}
              </span>
            </div>
            <p class="suggestion-message">{{ suggestion.message }}</p>

            <button
              v-if="suggestion.action"
              @click="handleSuggestionAction(suggestion.action)"
              class="suggestion-action-btn"
            >
              应用建议
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细布局控制 -->
    <div v-show="!isCompact" class="layout-controls">

      <!-- 侧边栏设置 -->
      <div class="control-group">
        <h4 class="group-title">
          <span class="group-icon">📋</span>
          侧边栏
        </h4>
        <div class="control-options">
          <label
            v-for="option in sidebarOptions"
            :key="option.value"
            class="option-label"
            :class="{ 'active': currentLayout.sidebar === option.value }"
          >
            <input
              type="radio"
              :value="option.value"
              v-model="localLayout.sidebar"
              @change="updateLayout"
            >
            <span class="option-icon">{{ option.icon }}</span>
            <span class="option-text">{{ option.text }}</span>
          </label>
        </div>
      </div>

      <!-- 面板布局 -->
      <div class="control-group">
        <h4 class="group-title">
          <span class="group-icon">🏗️</span>
          面板布局
        </h4>
        <div class="control-options">
          <label
            v-for="option in panelOptions"
            :key="option.value"
            class="option-label"
            :class="{ 'active': currentLayout.panels === option.value }"
          >
            <input
              type="radio"
              :value="option.value"
              v-model="localLayout.panels"
              @change="updateLayout"
            >
            <span class="option-icon">{{ option.icon }}</span>
            <span class="option-text">{{ option.text }}</span>
          </label>
        </div>
      </div>

      <!-- 工具栏设置 -->
      <div class="control-group">
        <h4 class="group-title">
          <span class="group-icon">🔧</span>
          工具栏
        </h4>
        <div class="control-options">
          <label
            v-for="option in toolbarOptions"
            :key="option.value"
            class="option-label"
            :class="{ 'active': currentLayout.toolbar === option.value }"
          >
            <input
              type="radio"
              :value="option.value"
              v-model="localLayout.toolbar"
              @change="updateLayout"
            >
            <span class="option-icon">{{ option.icon }}</span>
            <span class="option-text">{{ option.text }}</span>
          </label>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="control-group">
        <h4 class="group-title">
          <span class="group-icon">📄</span>
          内容区域
        </h4>
        <div class="control-options">
          <label
            v-for="option in contentOptions"
            :key="option.value"
            class="option-label"
            :class="{ 'active': currentLayout.content === option.value }"
          >
            <input
              type="radio"
              :value="option.value"
              v-model="localLayout.content"
              @change="updateLayout"
            >
            <span class="option-icon">{{ option.icon }}</span>
            <span class="option-text">{{ option.text }}</span>
          </label>
        </div>
      </div>

      <!-- 间距设置 -->
      <div class="control-group">
        <h4 class="group-title">
          <span class="group-icon">📏</span>
          间距
        </h4>
        <div class="control-options">
          <label
            v-for="option in spacingOptions"
            :key="option.value"
            class="option-label"
            :class="{ 'active': currentLayout.spacing === option.value }"
          >
            <input
              type="radio"
              :value="option.value"
              v-model="localLayout.spacing"
              @change="updateLayout"
            >
            <span class="option-icon">{{ option.icon }}</span>
            <span class="option-text">{{ option.text }}</span>
          </label>
        </div>
      </div>

    </div>

    <!-- 窗口控制 -->
    <div class="window-controls">
      <h4 class="section-title">
        <span class="section-icon">🪟</span>
        窗口控制
      </h4>

      <div class="window-actions">
        <button
          @click="windowControls.toggleFullscreen()"
          class="window-btn fullscreen-btn"
          :class="{ 'active': isFullscreen }"
        >
          <span class="btn-icon">{{ isFullscreen ? '🗗' : '🗖' }}</span>
          <span class="btn-text">{{ isFullscreen ? '退出全屏' : '全屏模式' }}</span>
        </button>

        <button
          v-if="windowState.canMinimize"
          @click="windowControls.minimize()"
          class="window-btn"
        >
          <span class="btn-icon">🗕</span>
          <span class="btn-text">最小化</span>
        </button>

        <button
          v-if="windowState.canMaximize"
          @click="windowControls.maximize()"
          class="window-btn"
        >
          <span class="btn-icon">🗖</span>
          <span class="btn-text">最大化</span>
        </button>
      </div>

      <div class="keyboard-shortcuts">
        <div class="shortcut-item">
          <kbd>F11</kbd>
          <span>全屏切换</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>F11</kbd>
          <span>全屏切换</span>
        </div>
        <div class="shortcut-item">
          <kbd>Alt</kbd> + <kbd>Enter</kbd>
          <span>全屏切换</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDesktopLayout, type LayoutConfig } from '../../composables/useDesktopLayout';

// 使用桌面布局系统
const {
  screenInfo,
  windowState,
  currentLayout,
  optimizedLayout,
  layoutSuggestions,
  handleSuggestionAction,
  applyLayout,
  applyOptimizedLayout,
  resetLayout,
  windowControls,
  isFullscreen
} = useDesktopLayout();

// 组件状态
const isCompact = ref(false);
const localLayout = ref<LayoutConfig>({ ...currentLayout.value });

// 选项配置
const sidebarOptions = [
  { value: 'hidden', icon: '🚫', text: '隐藏' },
  { value: 'collapsed', icon: '📂', text: '折叠' },
  { value: 'expanded', icon: '📋', text: '展开' },
  { value: 'floating', icon: '🏷️', text: '浮动' }
];

const panelOptions = [
  { value: 'single', icon: '▫️', text: '单面板' },
  { value: 'dual', icon: '▪️▪️', text: '双面板' },
  { value: 'multi', icon: '▪️▪️▪️', text: '多面板' }
];

const toolbarOptions = [
  { value: 'hidden', icon: '🚫', text: '隐藏' },
  { value: 'compact', icon: '📌', text: '紧凑' },
  { value: 'full', icon: '🔧', text: '完整' }
];

const contentOptions = [
  { value: 'centered', icon: '🎯', text: '居中' },
  { value: 'wide', icon: '📐', text: '宽屏' },
  { value: 'full', icon: '🔳', text: '全宽' }
];

const spacingOptions = [
  { value: 'compact', icon: '📦', text: '紧凑' },
  { value: 'normal', icon: '📋', text: '正常' },
  { value: 'relaxed', icon: '📄', text: '宽松' }
];

// 辅助方法
const getScreenIcon = (category: string): string => {
  switch (category) {
    case 'small': return '💻';
    case 'medium': return '🖥️';
    case 'large': return '🖥️';
    case 'xlarge': return '🖥️';
    case 'ultra': return '📺';
    default: return '💻';
  }
};

const getScreenText = (category: string): string => {
  switch (category) {
    case 'small': return '小屏';
    case 'medium': return '中屏';
    case 'large': return '大屏';
    case 'xlarge': return '超大屏';
    case 'ultra': return '4K/超宽';
    default: return '未知';
  }
};

const getSuggestionIcon = (type: string): string => {
  switch (type) {
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    case 'recommendation': return '💡';
    default: return '💡';
  }
};

const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'low': return '低';
    case 'medium': return '中';
    case 'high': return '高';
    default: return '中';
  }
};

// 更新布局
const updateLayout = (): void => {
  applyLayout(localLayout.value);
};

// 同步当前布局到本地状态
watch(currentLayout, (newLayout) => {
  localLayout.value = { ...newLayout };
}, { deep: true, immediate: true });
</script>

<style scoped>
.layout-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin: var(--space-4);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  max-width: 800px;
}

.layout-panel.compact {
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

.screen-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.screen-indicator.small {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.screen-indicator.medium {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-info);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.screen-indicator.large,
.screen-indicator.xlarge,
.screen-indicator.ultra {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
  border: 1px solid rgba(34, 197, 94, 0.2);
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

.control-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-brand-blue);
}

.optimize-btn {
  background: var(--color-brand-blue);
  color: white;
  border-color: var(--color-brand-blue);
}

.optimize-btn:hover {
  background: var(--color-brand-blue-dark);
}

/* 屏幕概览 */
.screen-overview {
  margin-bottom: var(--space-4);
}

.screen-stats {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.stat-label {
  color: var(--color-text-secondary);
}

.stat-value {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.badge {
  padding: 2px var(--space-1);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.badge.ultra {
  background: var(--color-brand-purple);
  color: white;
}

.badge.wide {
  background: var(--color-brand-blue);
  color: white;
}

.badge.normal {
  background: var(--color-text-secondary);
  color: white;
}

.badge.k4 {
  background: var(--color-success);
  color: white;
}

.badge.retina {
  background: var(--color-warning);
  color: white;
}

/* 建议区域 */
.suggestions-section {
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

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.suggestion-item {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border-left: 4px solid;
}

.suggestion-item.warning {
  border-left-color: var(--color-warning);
  background: rgba(245, 158, 11, 0.05);
}

.suggestion-item.info {
  border-left-color: var(--color-info);
  background: rgba(59, 130, 246, 0.05);
}

.suggestion-item.recommendation {
  border-left-color: var(--color-success);
  background: rgba(34, 197, 94, 0.05);
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.suggestion-icon {
  font-size: var(--font-size-lg);
}

.suggestion-title {
  flex: 1;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.priority-badge {
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.priority-badge.low {
  background: var(--color-text-secondary);
  color: white;
}

.priority-badge.medium {
  background: var(--color-warning);
  color: white;
}

.priority-badge.high {
  background: var(--color-error);
  color: white;
}

.suggestion-message {
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3) 0;
  line-height: var(--line-height-relaxed);
}

.suggestion-action-btn {
  background: var(--color-brand-blue);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.suggestion-action-btn:hover {
  background: var(--color-brand-blue-dark);
}

/* 布局控制 */
.layout-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.control-group {
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

.control-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-2);
}

.option-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-surface);
}

.option-label:hover {
  border-color: var(--color-brand-blue);
  background: var(--color-bg-tertiary);
}

.option-label.active {
  border-color: var(--color-brand-blue);
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-brand-blue);
}

.option-label input[type="radio"] {
  display: none;
}

.option-icon {
  font-size: var(--font-size-md);
}

.option-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* 窗口控制 */
.window-controls {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.window-actions {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.window-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.window-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-brand-blue);
}

.fullscreen-btn.active {
  background: var(--color-brand-blue);
  color: white;
  border-color: var(--color-brand-blue);
}

.btn-icon {
  font-size: var(--font-size-md);
}

.btn-text {
  font-weight: var(--font-weight-medium);
}

.keyboard-shortcuts {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-secondary);
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

kbd {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-1);
  font-size: 10px;
  font-family: var(--font-family-mono);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-panel {
    margin: var(--space-2);
    padding: var(--space-3);
  }

  .panel-header {
    flex-direction: column;
    gap: var(--space-3);
    align-items: stretch;
  }

  .screen-stats {
    flex-direction: column;
    gap: var(--space-2);
  }

  .control-options {
    grid-template-columns: 1fr;
  }

  .window-actions {
    flex-direction: column;
  }
}
</style>
