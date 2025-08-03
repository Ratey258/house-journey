<!--
  游戏主页面
  整合所有游戏Widget组件的主页面
-->
<template>
  <div class="game-page">
    <!-- 页面加载状态 -->
    <div v-if="state.isLoading" class="page-loading">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <h2>正在加载游戏...</h2>
        <p>请稍候，正在初始化游戏数据</p>
      </div>
    </div>

    <!-- 页面错误状态 -->
    <div v-else-if="state.error" class="page-error">
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h2>加载失败</h2>
        <p>{{ state.error }}</p>
        <button @click="retryInitialization" class="retry-button">
          重试
        </button>
      </div>
    </div>

    <!-- 游戏主内容 -->
    <div v-else-if="isReady" class="game-content">
      <!-- 游戏布局组件 -->
      <GameLayoutWidget />
      
      <!-- 快捷导航 -->
      <nav class="quick-navigation">
        <button 
          @click="navigateToMarket" 
          class="nav-button market-nav"
          title="前往市场页面"
        >
          🏪 市场
        </button>
        
        <button 
          @click="navigateToPlayer" 
          class="nav-button player-nav"
          title="前往玩家页面"
        >
          👤 玩家
        </button>
        
        <button 
          @click="navigateToSettings" 
          class="nav-button settings-nav"
          title="前往设置页面"
        >
          ⚙️ 设置
        </button>
      </nav>

      <!-- 游戏状态指示器 -->
      <div class="game-status">
        <div class="status-item">
          <span class="status-label">自动保存:</span>
          <span :class="['status-value', { active: config.autoSave }]">
            {{ config.autoSave ? '开启' : '关闭' }}
          </span>
        </div>
        
        <div class="status-item">
          <span class="status-label">音效:</span>
          <span :class="['status-value', { active: config.soundEnabled }]">
            {{ config.soundEnabled ? '开启' : '关闭' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useGamePage } from '../model/useGamePage';
import { GameLayoutWidget } from '../../../widgets/game-layout';

// 页面逻辑
const {
  state,
  config,
  pageTitle,
  isReady,
  switchView,
  navigateToMarket,
  navigateToPlayer,
  navigateToSettings,
  retryInitialization
} = useGamePage();

// 监听页面标题变化
watch(pageTitle, (newTitle) => {
  document.title = newTitle;
}, { immediate: true });

// 页面元信息
defineOptions({
  name: 'GamePage'
});
</script>

<style scoped>
.game-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg-primary);
}

/* 加载状态样式 */
.page-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--color-bg-primary);
}

.loading-container {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container h2 {
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.loading-container p {
  color: var(--color-text-secondary);
}

/* 错误状态样式 */
.page-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--color-bg-primary);
}

.error-container {
  text-align: center;
  padding: 2rem;
  max-width: 400px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-container h2 {
  color: var(--color-error);
  margin-bottom: 1rem;
}

.error-container p {
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.retry-button {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background: var(--color-primary-dark);
}

/* 游戏内容样式 */
.game-content {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 快捷导航样式 */
.quick-navigation {
  position: fixed;
  top: 1rem;
  left: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 1000;
}

.nav-button {
  padding: 0.5rem 1rem;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-button:hover {
  background: var(--color-bg-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.nav-button.market-nav:hover {
  border-color: var(--color-success);
}

.nav-button.player-nav:hover {
  border-color: var(--color-primary);
}

.nav-button.settings-nav:hover {
  border-color: var(--color-warning);
}

/* 游戏状态指示器 */
.game-status {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.8rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-label {
  color: var(--color-text-secondary);
}

.status-value {
  color: var(--color-text-primary);
  font-weight: 500;
}

.status-value.active {
  color: var(--color-success);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quick-navigation {
    position: static;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .game-status {
    position: static;
    flex-direction: row;
    justify-content: center;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
  }
}
</style>