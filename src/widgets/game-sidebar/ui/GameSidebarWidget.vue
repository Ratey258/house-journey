<!--
  游戏侧边栏Widget
  显示玩家信息、游戏统计等
-->
<template>
  <div class="game-sidebar-widget">
    <!-- 加载状态 -->
    <div v-if="!isLoaded" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载玩家数据...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
    </div>

    <!-- 正常内容 -->
    <div v-else class="sidebar-content">
      <!-- 玩家信息区域 -->
      <SidebarSection 
        :title="'玩家信息'"
        :collapsed="sections.find(s => s.id === 'player-info')?.collapsed || false"
        @toggle="toggleSection('player-info')"
      >
        <PlayerInfoPanel v-if="playerInfo" :player-info="playerInfo" />
      </SidebarSection>

      <!-- 游戏统计区域 -->
      <SidebarSection 
        :title="'游戏统计'"
        :collapsed="sections.find(s => s.id === 'game-stats')?.collapsed || false"
        @toggle="toggleSection('game-stats')"
      >
        <GameStatsPanel v-if="gameStats" :game-stats="gameStats" />
      </SidebarSection>

      <!-- 快捷操作区域 -->
      <SidebarSection 
        :title="'快捷操作'"
        :collapsed="sections.find(s => s.id === 'quick-actions')?.collapsed || false"
        @toggle="toggleSection('quick-actions')"
      >
        <QuickActionsPanel />
      </SidebarSection>
    </div>

    <!-- 侧边栏控制 -->
    <div class="sidebar-controls">
      <button @click="expandAll" class="control-button" title="展开所有">
        📖
      </button>
      <button @click="collapseAll" class="control-button" title="折叠所有">
        📕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameSidebar } from '../model/useGameSidebar';

// 子组件导入
import SidebarSection from './components/SidebarSection.vue';
import PlayerInfoPanel from './components/PlayerInfoPanel.vue';
import GameStatsPanel from './components/GameStatsPanel.vue';
import QuickActionsPanel from './components/QuickActionsPanel.vue';

// 使用侧边栏功能
const {
  playerInfo,
  gameStats,
  sections,
  isLoaded,
  error,
  toggleSection,
  collapseAll,
  expandAll
} = useGameSidebar();
</script>

<style scoped>
.game-sidebar-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
}

.loading-state,
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.sidebar-controls {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}

.control-button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.control-button:hover {
  background: var(--color-bg-hover);
}
</style>