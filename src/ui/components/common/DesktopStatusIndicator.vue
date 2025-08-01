<!--
  桌面端状态指示器组件
  显示网络状态、系统信息、性能提示等桌面端特有信息
-->

<template>
  <div class="desktop-status-indicator" v-if="isElectron">
    <!-- 主要状态栏 -->
    <div class="status-bar">
      <!-- 网络状态 -->
      <div
        class="status-item network-status"
        :class="{ 'offline': !networkStatus.online }"
        @click="showNetworkDetails"
      >
        <span class="status-icon">
          {{ networkStatus.online ? '🌐' : '📡' }}
        </span>
        <span class="status-text">
          {{ networkStatus.online ? '在线' : '离线' }}
        </span>
      </div>

      <!-- 系统信息快速预览 -->
      <div
        class="status-item system-info"
        @click="showSystemDetails"
        v-if="systemInfo"
      >
        <span class="status-icon">💻</span>
        <span class="status-text">
          {{ Math.round(systemInfo.freeMemory / 1024 / 1024) }}MB
        </span>
      </div>

      <!-- 性能提示 -->
      <div
        class="status-item performance-hints"
        :class="{ 'has-hints': performanceHints.length > 0 }"
        @click="showPerformanceHints"
        v-if="performanceHints.length > 0"
      >
        <span class="status-icon">⚡</span>
        <span class="status-text">
          {{ performanceHints.length }}个提示
        </span>
      </div>

      <!-- 窗口控制按钮 -->
      <div class="window-controls">
        <button
          class="control-btn minimize-btn"
          @click="windowControls.minimize"
          title="最小化"
        >
          ➖
        </button>
        <button
          class="control-btn maximize-btn"
          @click="windowControls.maximize"
          title="最大化/还原"
        >
          {{ isWindowMaximized ? '🗗' : '🗖' }}
        </button>
        <button
          class="control-btn close-btn"
          @click="windowControls.close"
          title="关闭"
        >
          ❌
        </button>
      </div>
    </div>

    <!-- 详细信息面板 -->
    <Transition name="details-panel">
      <div v-if="showDetails" class="details-panel" @click.stop>
        <!-- 网络详细信息 -->
        <div v-if="activePanel === 'network'" class="detail-section">
          <h3>网络状态</h3>
          <div class="detail-item">
            <span class="label">连接状态:</span>
            <span class="value" :class="{ 'online': networkStatus.online, 'offline': !networkStatus.online }">
              {{ networkStatus.online ? '在线' : '离线' }}
            </span>
          </div>
          <div class="detail-item">
            <span class="label">连接类型:</span>
            <span class="value">{{ networkStatus.connectionType }}</span>
          </div>
          <div class="detail-item">
            <span class="label">有效类型:</span>
            <span class="value">{{ networkStatus.effectiveType }}</span>
          </div>
          <button @click="refreshNetworkStatus" class="refresh-btn">
            🔄 刷新网络状态
          </button>
        </div>

        <!-- 系统详细信息 -->
        <div v-if="activePanel === 'system'" class="detail-section">
          <h3>系统信息</h3>
          <div class="detail-item">
            <span class="label">操作系统:</span>
            <span class="value">{{ systemInfo?.platform }} {{ systemInfo?.arch }}</span>
          </div>
          <div class="detail-item">
            <span class="label">应用版本:</span>
            <span class="value">v{{ systemInfo?.appVersion }}</span>
          </div>
                    <div class="detail-item" v-if="systemInfo">
            <span class="label">内存使用:</span>
            <span class="value">
              {{ Math.round((systemInfo.totalMemory - systemInfo.freeMemory) / 1024 / 1024) }}MB /
              {{ Math.round(systemInfo.totalMemory / 1024 / 1024) }}MB
              ({{ Math.round(((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory) * 100) }}%)
            </span>
          </div>
          <div class="detail-item">
            <span class="label">CPU核心:</span>
            <span class="value">{{ systemInfo?.cpus }}核</span>
          </div>
          <div class="detail-item">
            <span class="label">系统运行时间:</span>
            <span class="value">{{ formatUptime(systemInfo?.uptime) }}</span>
          </div>
          <button @click="refreshSystemInfo" class="refresh-btn">
            🔄 刷新系统信息
          </button>
        </div>

        <!-- 性能提示详细信息 -->
        <div v-if="activePanel === 'performance'" class="detail-section">
          <h3>性能优化建议</h3>
          <div v-if="performanceHints.length === 0" class="no-hints">
            暂无性能优化建议
          </div>
          <div v-else class="hints-list">
            <div
              v-for="(hint, index) in performanceHints"
              :key="index"
              class="hint-item"
            >
              <span class="hint-icon">💡</span>
              <span class="hint-text">{{ hint }}</span>
            </div>
          </div>
          <button @click="clearPerformanceHints" class="clear-btn" v-if="performanceHints.length > 0">
            🗑️ 清除所有提示
          </button>
        </div>
      </div>
    </Transition>

    <!-- 点击外部关闭 -->
    <div v-if="showDetails" class="overlay" @click="closeDetails"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDesktopExperience } from '../../composables/useDesktopExperience';

// 桌面端体验功能
const {
  isElectron,
  networkStatus,
  systemInfo,
  isWindowMaximized,
  performanceHints,
  updateNetworkStatus,
  updateSystemInfo,
  clearPerformanceHints,
  windowControls
} = useDesktopExperience();

// 详细信息面板状态
const showDetails = ref(false);
const activePanel = ref<'network' | 'system' | 'performance' | null>(null);

// 显示网络详细信息
function showNetworkDetails() {
  activePanel.value = 'network';
  showDetails.value = true;
}

// 显示系统详细信息
function showSystemDetails() {
  activePanel.value = 'system';
  showDetails.value = true;
}

// 显示性能提示详细信息
function showPerformanceHints() {
  activePanel.value = 'performance';
  showDetails.value = true;
}

// 关闭详细信息面板
function closeDetails() {
  showDetails.value = false;
  activePanel.value = null;
}

// 刷新网络状态
async function refreshNetworkStatus() {
  await updateNetworkStatus();
}

// 刷新系统信息
async function refreshSystemInfo() {
  await updateSystemInfo();
}

// 格式化运行时间
function formatUptime(seconds?: number): string {
  if (!seconds) return '未知';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
}
</script>

<style scoped>
.desktop-status-indicator {
  position: fixed;
  top: 0;
  right: 0;
  z-index: var(--z-index-fixed);
  font-size: var(--font-size-xs);
  user-select: none;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-primary);
  border-top: none;
  border-right: none;
  border-radius: 0 0 0 var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast) var(--ease-default);
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-default);
}

.status-item:hover {
  background-color: var(--color-bg-tertiary);
}

.status-item.offline {
  color: var(--color-error-red);
}

.status-item.has-hints {
  color: var(--color-warning-orange);
  animation: pulse 2s infinite;
}

.status-icon {
  font-size: var(--font-size-sm);
  line-height: 1;
}

.status-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

/* 窗口控制按钮 */
.window-controls {
  display: flex;
  gap: var(--space-1);
  margin-left: var(--space-2);
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  font-size: 10px;
  transition: all var(--transition-fast) var(--ease-default);
}

.control-btn:hover {
  background-color: var(--color-bg-tertiary);
}

.minimize-btn:hover {
  background-color: rgba(255, 193, 7, 0.2);
}

.maximize-btn:hover {
  background-color: rgba(40, 167, 69, 0.2);
}

.close-btn:hover {
  background-color: rgba(220, 53, 69, 0.2);
}

/* 详细信息面板 */
.details-panel {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 300px;
  max-width: 400px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: var(--z-index-dropdown);
}

.detail-section {
  padding: var(--space-4);
}

.detail-section h3 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-secondary);
  padding-bottom: var(--space-2);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
  padding: var(--space-2) 0;
}

.detail-item .label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  flex: 0 0 auto;
}

.detail-item .value {
  color: var(--color-text-primary);
  text-align: right;
  flex: 1;
  margin-left: var(--space-2);
}

.detail-item .value.online {
  color: var(--color-success-green);
}

.detail-item .value.offline {
  color: var(--color-error-red);
}

.refresh-btn, .clear-btn {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--font-size-xs);
  margin-top: var(--space-3);
  transition: all var(--transition-fast) var(--ease-default);
}

.refresh-btn:hover, .clear-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-brand-blue);
}

/* 性能提示列表 */
.hints-list {
  max-height: 200px;
  overflow-y: auto;
}

.hint-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2);
  margin-bottom: var(--space-2);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-warning-orange);
}

.hint-icon {
  flex: 0 0 auto;
  font-size: var(--font-size-sm);
}

.hint-text {
  flex: 1;
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
}

.no-hints {
  text-align: center;
  color: var(--color-text-secondary);
  font-style: italic;
  padding: var(--space-4);
}

/* 遮罩层 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-index-base);
}

/* 动画 */
.details-panel-enter-active,
.details-panel-leave-active {
  transition: all var(--transition-normal) var(--ease-default);
  transform-origin: top right;
}

.details-panel-enter-from,
.details-panel-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-8px);
}

.details-panel-enter-to,
.details-panel-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .desktop-status-indicator {
    position: relative;
    top: auto;
    right: auto;
  }

  .status-bar {
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-primary);
  }

  .details-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
  }
}

/* 暗色主题下的特殊调整 */
[data-theme="dark"] .status-bar {
  background: rgba(45, 45, 45, 0.95);
  backdrop-filter: blur(8px);
}

[data-theme="dark"] .details-panel {
  background: rgba(45, 45, 45, 0.98);
  backdrop-filter: blur(12px);
}
</style>
