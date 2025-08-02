<!--
  GameMainPanel 组件
  从 GameView.vue 拆分出来的中央内容区域
  包含：标签页导航、市场、背包、房屋等内容区域
-->
<template>
  <div class="game-main-panel">
    <!-- 标签页导航 -->
    <div class="tab-buttons">
      <button
        :class="['tab-button', { active: activeTab === 'market' }]"
        @click="$emit('switchTab', 'market')"
      >
        {{ $t('game.tabs.market') }}
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'inventory' }]"
        @click="$emit('switchTab', 'inventory')"
      >
        {{ $t('game.tabs.inventory') }}
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'houses' }]"
        @click="$emit('switchTab', 'houses')"
      >
        {{ $t('game.tabs.houses') }}
      </button>
    </div>

    <!-- 标签页内容 -->
    <div class="tab-content">
      <transition name="tab-fade" mode="out-in">
        <!-- 市场标签页 -->
        <div v-if="activeTab === 'market'" class="market-tab" key="market">
          <Market />
        </div>

        <!-- 背包标签页 -->
        <div v-else-if="activeTab === 'inventory'" class="inventory-tab" key="inventory">
          <Inventory />
        </div>

        <!-- 房屋标签页 -->
        <div v-else-if="activeTab === 'houses'" class="houses-tab" key="houses">
          <HouseMarket />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import Market from '../market/Market.vue';
import Inventory from '../player/Inventory.vue';
import HouseMarket from '../market/HouseMarket.vue';

interface Props {
  activeTab: string;
}

interface Emits {
  (e: 'switchTab', tab: string): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<style scoped>
.game-main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

/* 标签按钮样式 */
.tab-buttons {
  display: flex;
  background: rgba(0,0,0,0.02);
  border-bottom: 1px solid rgba(0,0,0,0.1);
  padding: 0;
}

.tab-button {
  flex: 1;
  padding: 16px 20px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.tab-button::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.tab-button:hover {
  background: rgba(102, 126, 234, 0.05);
  color: #333;
}

.tab-button.active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  font-weight: 600;
}

.tab-button.active::before {
  transform: scaleX(1);
}

/* 标签内容样式 */
.tab-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.market-tab,
.inventory-tab,
.houses-tab {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

/* 标签切换动画 */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: all 0.4s ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 滚动条样式 */
.market-tab::-webkit-scrollbar,
.inventory-tab::-webkit-scrollbar,
.houses-tab::-webkit-scrollbar {
  width: 8px;
}

.market-tab::-webkit-scrollbar-track,
.inventory-tab::-webkit-scrollbar-track,
.houses-tab::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.05);
  border-radius: 4px;
}

.market-tab::-webkit-scrollbar-thumb,
.inventory-tab::-webkit-scrollbar-thumb,
.houses-tab::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
}

.market-tab::-webkit-scrollbar-thumb:hover,
.inventory-tab::-webkit-scrollbar-thumb:hover,
.houses-tab::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.3);
}

/* 桌面端紧凑布局优化 */
@media (max-width: 1280px) {
  .tab-button {
    padding: 12px 16px;
    font-size: 0.9rem;
  }
  
  .market-tab,
  .inventory-tab,
  .houses-tab {
    padding: 16px;
  }
}
</style>