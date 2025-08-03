<!--
  玩家页面
  专门的玩家信息管理页面
-->
<template>
  <div class="player-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-content">
        <button @click="backToGame" class="back-button">
          ← 返回游戏
        </button>
        
        <div class="page-title">
          <h1>{{ meta.title }}</h1>
          <p>{{ meta.description }}</p>
        </div>
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="page-content">
      <!-- 侧边导航 -->
      <nav class="section-nav">
        <button
          v-for="section in sections"
          :key="section.id"
          :class="['nav-item', { active: state.activeSection === section.id }]"
          @click="setActiveSection(section.id)"
        >
          <span class="nav-icon">{{ section.icon }}</span>
          <span class="nav-text">{{ section.name }}</span>
        </button>
      </nav>

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 玩家概览 -->
        <div v-if="state.activeSection === 'overview'" class="content-panel">
          <h2>玩家概览</h2>
          <GameSidebarWidget />
        </div>

        <!-- 库存管理 -->
        <div v-else-if="state.activeSection === 'inventory'" class="content-panel">
          <h2>库存管理</h2>
          <InventoryWidget />
        </div>

        <!-- 房产管理 -->
        <div v-else-if="state.activeSection === 'houses'" class="content-panel">
          <h2>房产管理</h2>
          <HouseMarketWidget />
        </div>

        <!-- 游戏统计 -->
        <div v-else-if="state.activeSection === 'statistics'" class="content-panel">
          <h2>游戏统计</h2>
          <div class="statistics-content">
            <p>详细的游戏统计信息将在此显示</p>
            <div class="placeholder-stats">
              <div class="stat-card">
                <h3>交易统计</h3>
                <p>总交易次数、成功率、平均利润等</p>
              </div>
              <div class="stat-card">
                <h3>财务状况</h3>
                <p>资产变化、债务情况、净资产趋势等</p>
              </div>
              <div class="stat-card">
                <h3>游戏进度</h3>
                <p>游戏时长、访问地点、成就解锁等</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { usePlayerPage } from '../model/usePlayerPage';
import { GameSidebarWidget } from '../../../widgets/game-sidebar';
// TODO: 导入其他Widget组件
// import { InventoryWidget } from '../../../widgets/inventory';
// import { HouseMarketWidget } from '../../../widgets/house-market';

// 页面逻辑
const {
  state,
  meta,
  setActiveSection,
  backToGame
} = usePlayerPage();

// 区域配置
const sections = computed(() => [
  {
    id: 'overview',
    name: '概览',
    icon: '👤'
  },
  {
    id: 'inventory',
    name: '库存',
    icon: '🎒'
  },
  {
    id: 'houses',
    name: '房产',
    icon: '🏠'
  },
  {
    id: 'statistics',
    name: '统计',
    icon: '📊'
  }
]);

// 临时组件占位符
const InventoryWidget = { template: '<div class="widget-placeholder">库存Widget - 待实现</div>' };
const HouseMarketWidget = { template: '<div class="widget-placeholder">房产Widget - 待实现</div>' };

// 监听页面标题变化
watch(() => meta.value.title, (newTitle) => {
  document.title = newTitle;
}, { immediate: true });

// 页面元信息
defineOptions({
  name: 'PlayerPage'
});
</script>

<style scoped>
.player-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
}

/* 页面头部 */
.page-header {
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.back-button {
  padding: 0.5rem 1rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.back-button:hover {
  background: var(--color-bg-hover);
}

.page-title h1 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.5rem;
}

.page-title p {
  margin: 0.25rem 0 0 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

/* 页面内容 */
.page-content {
  flex: 1;
  display: grid;
  grid-template-columns: 250px 1fr;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* 侧边导航 */
.section-nav {
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.nav-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.nav-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-right: 3px solid var(--color-primary);
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-text {
  font-weight: 500;
}

/* 内容区域 */
.content-area {
  padding: 2rem;
  overflow-y: auto;
}

.content-panel {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-panel h2 {
  margin: 0 0 2rem 0;
  color: var(--color-text-primary);
  font-size: 1.3rem;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 0.5rem;
}

/* 统计内容 */
.statistics-content {
  color: var(--color-text-secondary);
}

.placeholder-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.stat-card {
  background: var(--color-bg-tertiary);
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.stat-card h3 {
  margin: 0 0 1rem 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.stat-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

/* Widget占位符 */
.widget-placeholder {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
  border: 2px dashed var(--color-border);
  border-radius: 6px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .page-content {
    grid-template-columns: 200px 1fr;
  }
}

@media (max-width: 768px) {
  .page-content {
    grid-template-columns: 1fr;
  }
  
  .section-nav {
    flex-direction: row;
    padding: 1rem;
    overflow-x: auto;
  }
  
  .nav-item {
    flex-shrink: 0;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    border-right: none;
  }
  
  .nav-item.active {
    background: var(--color-primary);
    color: white;
    border-right: none;
  }
}
</style>