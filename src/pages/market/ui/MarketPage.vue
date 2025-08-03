<!--
  市场页面
  专门的市场交易页面，提供更详细的交易功能
-->
<template>
  <div class="market-page">
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

        <div class="current-location">
          <span class="location-label">当前位置:</span>
          <span class="location-name">{{ meta.currentLocationName }}</span>
        </div>
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="page-content">
      <!-- 使用市场Widget -->
      <div class="market-widget-container">
        <MarketWidget />
      </div>

      <!-- 市场统计面板 -->
      <aside class="market-stats">
        <div class="stats-panel">
          <h3>市场统计</h3>
          <div class="stat-item">
            <span class="stat-label">今日交易:</span>
            <span class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总利润:</span>
            <span class="stat-value">¥0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">成功率:</span>
            <span class="stat-value">0%</span>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <h3>快捷操作</h3>
          <button class="action-button">刷新价格</button>
          <button class="action-button">查看历史</button>
          <button class="action-button">市场分析</button>
        </div>
      </aside>
    </main>

    <!-- 页面底部 -->
    <footer class="page-footer">
      <div class="footer-content">
        <span>市场交易 | 实时价格更新</span>
        <span class="last-update">最后更新: {{ new Date().toLocaleTimeString() }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useMarketPage } from '../model/useMarketPage';
import { MarketWidget } from '../../../widgets/market';

// 页面逻辑
const {
  state,
  meta,
  backToGame
} = useMarketPage();

// 监听页面标题变化
watch(() => meta.value.title, (newTitle) => {
  document.title = newTitle;
}, { immediate: true });

// 页面元信息
defineOptions({
  name: 'MarketPage'
});
</script>

<style scoped>
.market-page {
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
  justify-content: space-between;
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

.current-location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary-light);
  border-radius: 6px;
}

.location-label {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.location-name {
  color: var(--color-primary);
  font-weight: 500;
}

/* 页面内容 */
.page-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.market-widget-container {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 统计面板 */
.market-stats {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-panel,
.quick-actions {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-panel h3,
.quick-actions h3 {
  margin: 0 0 1rem 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.stat-value {
  color: var(--color-text-primary);
  font-weight: 500;
}

.action-button {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-button:hover {
  background: var(--color-bg-hover);
}

.action-button:last-child {
  margin-bottom: 0;
}

/* 页面底部 */
.page-footer {
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  padding: 1rem 2rem;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.last-update {
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .page-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .market-stats {
    order: -1;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .current-location {
    align-self: stretch;
    justify-content: center;
  }

  .page-content {
    padding: 1rem;
  }

  .footer-content {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>