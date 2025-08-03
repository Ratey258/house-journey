<!--
  Enhanced Player Info 组件示例
  展示如何使用Service Composables而不是直接访问Store
  
  优势：
  1. 更好的关注点分离
  2. 更容易的单元测试
  3. 更好的类型安全
  4. 符合Clean Architecture原则
-->
<template>
  <div class="enhanced-player-info">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载玩家信息...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="refreshData" class="retry-btn">重试</button>
    </div>

    <!-- 正常状态 -->
    <div v-else-if="player" class="player-content">
      <div class="player-header">
        <div class="avatar-container">
          <div class="avatar">{{ getPlayerInitials() }}</div>
        </div>
        <div class="player-name-container">
          <h2 class="player-name">{{ player.name }}</h2>
          <div class="player-id">ID: {{ player.id }}</div>
        </div>
      </div>

      <!-- 财务信息 -->
      <div class="finance-section">
        <div class="finance-item">
          <span class="finance-icon">💰</span>
          <div class="finance-value money">¥{{ formatNumber(playerMoney) }}</div>
          <div class="finance-label">资金</div>
        </div>

        <div class="finance-item" v-if="playerDebt > 0">
          <span class="finance-icon">💸</span>
          <div class="finance-value debt">¥{{ formatNumber(playerDebt) }}</div>
          <div class="finance-label">债务</div>
        </div>
      </div>

      <!-- 库存信息 -->
      <div class="inventory-section">
        <h3>背包 ({{ playerInventory.length }} 种商品)</h3>
        <div class="inventory-summary">
          <p>总价值: ¥{{ calculateInventoryValue() }}</p>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section" v-if="playerStatistics">
        <h3>交易统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ playerStatistics.transactionCount }}</span>
            <span class="stat-label">交易次数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">¥{{ formatNumber(playerStatistics.totalProfit) }}</span>
            <span class="stat-label">总利润</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">¥{{ formatNumber(playerStatistics.averageProfit) }}</span>
            <span class="stat-label">平均利润</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button 
          @click="refreshData" 
          :disabled="isLoading"
          class="btn refresh-btn"
        >
          🔄 刷新数据
        </button>
        <button 
          @click="saveData" 
          :disabled="isLoading"
          class="btn save-btn"
        >
          💾 保存数据
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { usePlayerService } from '../../composables/usePlayerService';
import { formatNumber } from '../../../infrastructure/utils/formatUtils';

// 使用Service Composable而不是直接访问Store
const {
  player,
  isLoading,
  error,
  playerMoney,
  playerDebt,
  playerInventory,
  playerStatistics,
  loadPlayer,
  savePlayer,
  refreshPlayer,
  clearError
} = usePlayerService();

// 计算属性
const getPlayerInitials = (): string => {
  if (!player.value?.name) return '?';
  return player.value.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const calculateInventoryValue = (): number => {
  if (!playerInventory.value) return 0;
  
  return playerInventory.value.reduce((total, item) => {
    // 这里应该通过Market Service获取当前价格
    // 为了演示，我们使用购买价格
    return total + (item.purchasePrice || 0) * (item.quantity || 0);
  }, 0);
};

// 方法
const refreshData = async (): Promise<void> => {
  clearError();
  await refreshPlayer();
};

const saveData = async (): Promise<void> => {
  clearError();
  await savePlayer();
};

// 组件挂载时加载数据
onMounted(async () => {
  await loadPlayer();
});
</script>

<style scoped>
.enhanced-player-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.loading-container, .error-container {
  text-align: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 8px;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.error-message {
  margin-bottom: 16px;
  color: #ffcccb;
}

.retry-btn {
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #ff3742;
}

.player-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.avatar-container {
  margin-right: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.player-name {
  margin: 0 0 4px;
  font-size: 24px;
}

.player-id {
  font-size: 14px;
  opacity: 0.8;
}

.finance-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.finance-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.finance-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}

.finance-value {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.finance-label {
  font-size: 14px;
  opacity: 0.8;
}

.inventory-section, .stats-section {
  margin-bottom: 24px;
}

.inventory-section h3, .stats-section h3 {
  margin: 0 0 12px;
  font-size: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 120px;
}

.btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-btn {
  background: rgba(52, 152, 219, 0.8);
}

.save-btn {
  background: rgba(46, 204, 113, 0.8);
}
</style>