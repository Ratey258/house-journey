<!--
  游戏布局Widget
  提供游戏主界面的整体布局结构
-->
<template>
  <div class="game-layout-widget" :class="layoutClasses">
    <!-- 主要内容区域 -->
    <div class="game-content">
      <!-- 侧边栏 -->
      <aside 
        v-if="showSidebar" 
        class="game-sidebar"
        :style="{ width: `${state.config.sidebarWidth}px` }"
      >
        <GameSidebarWidget />
      </aside>

      <!-- 主面板 -->
      <main class="game-main">
        <!-- 标签页导航 -->
        <nav class="tab-navigation">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-button', { active: activeTab === tab.id }]"
            @click="switchTab(tab.id)"
          >
            <span v-if="tab.icon" class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-name">{{ tab.name }}</span>
          </button>
        </nav>

        <!-- 标签页内容 -->
        <div class="tab-content">
          <transition name="tab-fade" mode="out-in">
            <!-- 市场标签页 -->
            <div v-if="activeTab === 'market'" key="market" class="tab-panel">
              <MarketWidget />
            </div>

            <!-- 背包标签页 -->
            <div v-else-if="activeTab === 'inventory'" key="inventory" class="tab-panel">
              <InventoryWidget />
            </div>

            <!-- 房产标签页 -->
            <div v-else-if="activeTab === 'houses'" key="houses" class="tab-panel">
              <HouseMarketWidget />
            </div>
          </transition>
        </div>
      </main>
    </div>

    <!-- 控制按钮 -->
    <div class="layout-controls">
      <button 
        @click="toggleSidebar" 
        class="control-btn sidebar-toggle"
        :title="showSidebar ? '隐藏侧边栏' : '显示侧边栏'"
      >
        {{ showSidebar ? '◀' : '▶' }}
      </button>
      
      <button 
        @click="toggleFullscreen" 
        class="control-btn fullscreen-toggle"
        :title="state.config.isFullscreen ? '退出全屏' : '进入全屏'"
      >
        {{ state.config.isFullscreen ? '🗗' : '🗖' }}
      </button>

      <button 
        v-if="isDev"
        @click="toggleDevTools" 
        class="control-btn dev-tools-toggle"
        :class="{ active: state.config.showDevTools }"
        title="开发工具"
      >
        🔧
      </button>
    </div>

    <!-- 开发工具（开发模式下显示） -->
    <DevToolsWidget 
      v-if="isDev && state.config.showDevTools" 
      @close="toggleDevTools"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameLayout } from '../model/useGameLayout';

// 组件导入 - 这些会在后续步骤中创建
import GameSidebarWidget from '../../game-sidebar/ui/GameSidebarWidget.vue';
import MarketWidget from '../../market/ui/MarketWidget.vue';
import InventoryWidget from '../../inventory/ui/InventoryWidget.vue';
import HouseMarketWidget from '../../house-market/ui/HouseMarketWidget.vue';
import DevToolsWidget from '../../dev-tools/ui/DevToolsWidget.vue';

// 使用游戏布局功能
const {
  state,
  activeTab,
  showSidebar,
  layoutClasses,
  tabs,
  switchTab,
  toggleSidebar,
  toggleFullscreen,
  toggleDevTools
} = useGameLayout();

// 开发模式检测
const isDev = computed(() => import.meta.env.DEV);
</script>

<style scoped>
.game-layout-widget {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg-primary);
}

.game-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

.game-sidebar {
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  transition: width 0.3s ease;
  overflow-y: auto;
}

.game-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tab-navigation {
  display: flex;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  padding: 0.5rem;
  gap: 0.5rem;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.tab-button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.tab-button.active {
  background: var(--color-primary);
  color: white;
}

.tab-icon {
  font-size: 1.1rem;
}

.tab-content {
  flex: 1;
  overflow: hidden;
}

.tab-panel {
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
}

.layout-controls {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 1000;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-btn:hover {
  background: var(--color-bg-hover);
  transform: translateY(-1px);
}

.control-btn.active {
  background: var(--color-primary);
  color: white;
}

/* 动画效果 */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.3s ease;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}

/* 响应式布局 */
.game-layout-widget.compact .game-sidebar {
  width: 250px !important;
}

.game-layout-widget.compact .tab-button {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

.game-layout-widget.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

/* 隐藏侧边栏时的布局调整 */
.game-layout-widget:not(.sidebar-visible) .game-main {
  margin-left: 0;
}
</style>