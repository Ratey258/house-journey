<!--
  GameSidebar 组件
  从 GameView.vue 拆分出来的左侧玩家信息面板
  包含：玩家信息、迷你背包显示
-->
<template>
  <div class="game-sidebar">
    <!-- 玩家信息组件 -->
    <PlayerInfo />

    <!-- 迷你背包显示 -->
    <div class="mini-inventory">
      <div class="mini-header">
        <h3 class="mini-title">{{ $t('inventory.title') }}</h3>
        <button
          class="view-all-btn"
          @click="$emit('switchToInventory')"
          :title="$t('inventory.viewAll')"
        >
          <i class="icon-expand">⤢</i>
        </button>
      </div>
      <div class="inventory-items">
        <div v-if="inventory.length === 0" class="empty-inventory">
          {{ $t('inventory.empty') }}
        </div>
        <div v-else class="inventory-list">
          <div v-for="item in inventory" :key="item.productId" class="inventory-item">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-details">
              <span class="item-quantity">x{{ item.quantity }}</span>
              <span class="item-price">¥{{ formatNumber(item.purchasePrice) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PlayerInfo from '../player/PlayerInfo.vue';
import { formatNumber } from '@/infrastructure/utils/formatUtils';

interface InventoryItem {
  productId: string;
  name: string;
  quantity: number;
  purchasePrice: number;
}

interface Props {
  inventory: InventoryItem[];
}

interface Emits {
  (e: 'switchToInventory'): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<style scoped>
.game-sidebar {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
}

/* 迷你背包样式 */
.mini-inventory {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.mini-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.mini-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.view-all-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 6px;
  color: white;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.view-all-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.icon-expand {
  font-style: normal;
  font-size: 1rem;
}

.inventory-items {
  max-height: 300px;
  overflow-y: auto;
}

.empty-inventory {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px 0;
  background: rgba(0,0,0,0.02);
  border-radius: 8px;
}

.inventory-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inventory-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0,0,0,0.02);
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.inventory-item:hover {
  background: rgba(0,0,0,0.05);
}

.item-name {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.item-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.item-quantity {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.item-price {
  font-size: 0.8rem;
  color: #2196F3;
  font-weight: 600;
}

/* 滚动条样式 */
.inventory-items::-webkit-scrollbar {
  width: 6px;
}

.inventory-items::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.05);
  border-radius: 3px;
}

.inventory-items::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.2);
  border-radius: 3px;
}

.inventory-items::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.3);
}

.game-sidebar::-webkit-scrollbar {
  width: 6px;
}

.game-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.game-sidebar::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.2);
  border-radius: 3px;
}

.game-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.3);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .game-sidebar {
    width: 240px;
  }
  
  .mini-inventory {
    padding: 12px;
  }
  
  .inventory-item {
    padding: 8px 10px;
  }
}

@media (max-width: 768px) {
  .game-sidebar {
    width: 100%;
    max-height: 200px;
  }
}
</style>