<template>
  <div class="inventory">
    <h2 class="title">{{ $t('inventory.title') }}</h2>
    
    <div class="inventory-container">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>{{ $t('inventory.productName') }}</th>
            <th>{{ $t('inventory.quantity') }}</th>
            <th>{{ $t('inventory.purchasePrice') }}</th>
            <th>{{ $t('inventory.currentPrice') }}</th>
            <th>{{ $t('inventory.trend') }}</th>
            <th>{{ $t('inventory.profit') }}</th>
            <th>{{ $t('inventory.action') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in playerInventory" :key="item.productId">
            <td>{{ item.name }}</td>
            <td>{{ item.quantity }}</td>
            <td class="price">¥{{ formatNumber(item.purchasePrice) }}</td>
            <td class="price">
              <span :class="getPriceClass(item)">¥{{ formatNumber(getCurrentPrice(item)) }}</span>
            </td>
            <td>
              <div class="trend-indicator" :class="getTrendClass(item)">
                <span class="trend-icon">{{ getTrendIcon(item) }}</span>
              </div>
            </td>
            <td :class="getProfitClass(item)">
              {{ getProfitText(item) }}
            </td>
            <td>
              <div class="action-buttons">
                <button 
                  class="sell-btn" 
                  @click="openTradePanel(item)"
                >
                  {{ $t('inventory.sell') }}
                </button>
                <button 
                  class="quick-sell-btn" 
                  @click="quickSell(item)"
                  title="快速卖出1个"
                >
                  -1
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="playerInventory.length === 0">
            <td colspan="7" class="no-items">{{ $t('inventory.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 交易面板 -->
    <div v-if="showTradePanel" class="modal-backdrop" @click.self="closeTradePanel">
      <TradePanel 
        :product="selectedProduct" 
        @close="closeTradePanel"
        @transaction-complete="handleTransactionComplete"
      />
    </div>
    
    <!-- 交易成功提示 -->
    <div v-if="showTransactionToast" class="transaction-toast" :class="transactionToastClass">
      <div class="toast-content">
        <span class="toast-icon">{{ transactionToastIcon }}</span>
        <span class="toast-message">{{ transactionToastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGameStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import { PriceTrend } from '@/core/services/priceSystem';
import TradePanel from '@/ui/components/market/TradePanel.vue';
import { formatNumber } from '@/infrastructure/utils';

const { t } = useI18n();
const gameStore = useGameStore();

// 计算属性
const player = computed(() => gameStore.player);
const playerInventory = computed(() => gameStore.playerInventory);
const currentLocation = computed(() => gameStore.currentLocation);

// 响应式变量
const showTradePanel = ref(false);
const selectedProduct = ref(null);
const selectedItem = ref(null); // 添加selectedItem变量
const sellQuantity = ref(1); // 添加sellQuantity变量
const showTransactionToast = ref(false);
const transactionToastMessage = ref('');
const transactionToastClass = ref('');
const transactionToastIcon = ref('');

// 计算总收入
const totalIncome = computed(() => {
  if (!selectedItem.value) return 0;
  return getCurrentPrice(selectedItem.value) * sellQuantity.value;
});

// 方法
const getCurrentPrice = (item) => {
  if (!item) return 0;
  return gameStore.getCurrentProductPrice(item.productId);
};

const getProductTrend = (item) => {
  if (!item) return PriceTrend.STABLE;
  return gameStore.getProductPriceTrend(item.productId);
};

// 价格趋势相关方法
const getTrendIcon = (item) => {
  const trend = getProductTrend(item);
  switch (trend) {
    case PriceTrend.RISING_STRONG: return '↑↑';
    case PriceTrend.RISING: return '↑';
    case PriceTrend.STABLE_HIGH: return '▲';
    case PriceTrend.STABLE: return '→';
    case PriceTrend.STABLE_LOW: return '▼';
    case PriceTrend.FALLING: return '↓';
    case PriceTrend.FALLING_STRONG: return '↓↓';
    case PriceTrend.VOLATILE: return '↕';
    default: return '→';
  }
};

const getTrendClass = (item) => {
  const trend = getProductTrend(item);
  switch (trend) {
    case PriceTrend.RISING_STRONG: return 'trend-rising-strong';
    case PriceTrend.RISING: return 'trend-rising';
    case PriceTrend.STABLE_HIGH: return 'trend-stable-high';
    case PriceTrend.STABLE: return 'trend-stable';
    case PriceTrend.STABLE_LOW: return 'trend-stable-low';
    case PriceTrend.FALLING: return 'trend-falling';
    case PriceTrend.FALLING_STRONG: return 'trend-falling-strong';
    case PriceTrend.VOLATILE: return 'trend-volatile';
    default: return 'trend-stable';
  }
};

const getPriceClass = (item) => {
  const currentPrice = getCurrentPrice(item);
  if (currentPrice > item.purchasePrice) return 'price-up';
  if (currentPrice < item.purchasePrice) return 'price-down';
  return '';
};

const getProfitClass = (item) => {
  const currentPrice = getCurrentPrice(item);
  if (currentPrice > item.purchasePrice) return 'profit profit-positive';
  if (currentPrice < item.purchasePrice) return 'profit profit-negative';
  return 'profit';
};

const getProfitText = (item) => {
  const currentPrice = getCurrentPrice(item);
  const diff = currentPrice - item.purchasePrice;
  const percentage = (diff / item.purchasePrice) * 100;
  
  if (diff === 0) return '0%';
  
  const sign = diff > 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
};

const getSellProfitClass = () => {
  if (!selectedItem.value) return '';
  const currentPrice = getCurrentPrice(selectedItem.value);
  if (currentPrice > selectedItem.value.purchasePrice) return 'profit-positive';
  if (currentPrice < selectedItem.value.purchasePrice) return 'profit-negative';
  return '';
};

const getSellProfitText = () => {
  if (!selectedItem.value) return '';
  
  const currentPrice = getCurrentPrice(selectedItem.value);
  const diff = (currentPrice - selectedItem.value.purchasePrice) * sellQuantity.value;
  
  if (diff === 0) return '¥0';
  
  const sign = diff > 0 ? '+' : '';
  return `${sign}¥${formatNumber(diff)}`;
};

const openSellModal = (item) => {
  selectedItem.value = item;
  sellQuantity.value = 1;
  showSellModal.value = true;
};

const closeSellModal = () => {
  showSellModal.value = false;
  selectedItem.value = null;
  sellQuantity.value = 1;
};

const incrementQuantity = () => {
  if (selectedItem.value && sellQuantity.value < selectedItem.value.quantity) {
    sellQuantity.value++;
  }
};

const decrementQuantity = () => {
  if (sellQuantity.value > 1) {
    sellQuantity.value--;
  }
};

const setMaxQuantity = () => {
  if (selectedItem.value) {
    sellQuantity.value = selectedItem.value.quantity;
  }
};

const sellProduct = () => {
  if (selectedItem.value && sellQuantity.value > 0) {
    gameStore.sellProduct(selectedItem.value.productId, sellQuantity.value);
    closeSellModal();
  }
};

const openTradePanel = (item) => {
  // 将库存项转换为交易面板需要的商品格式
  const product = {
    id: item.productId,
    name: item.name,
    currentPrice: getCurrentPrice(item),
    trend: getProductTrend(item),
    changePercent: calculateChangePercent(item),
    category: item.category || 'unknown'
  };
  
  selectedProduct.value = product;
  showTradePanel.value = true;
};

const closeTradePanel = () => {
  showTradePanel.value = false;
  selectedProduct.value = null;
};

const handleTransactionComplete = (transaction) => {
  closeTradePanel();
  
  // 显示交易成功提示
  if (transaction.type === 'sell') {
    transactionToastMessage.value = `成功卖出 ${transaction.quantity} 个 ${transaction.productId}`;
    transactionToastClass.value = 'sell-success';
    transactionToastIcon.value = '✓';
    
    showTransactionToast.value = true;
    
    // 3秒后自动隐藏提示
    setTimeout(() => {
      showTransactionToast.value = false;
    }, 3000);
  }
};

const calculateChangePercent = (item) => {
  const currentPrice = getCurrentPrice(item);
  const purchasePrice = item.purchasePrice;
  
  if (purchasePrice === 0) return 0;
  
  return ((currentPrice - purchasePrice) / purchasePrice) * 100;
};

const quickSell = (item) => {
  if (item.quantity > 0) {
    gameStore.sellProduct(item.productId, 1);
    
    // 显示快速卖出成功提示
    transactionToastMessage.value = `快速卖出 1 个 ${item.name}`;
    transactionToastClass.value = 'sell-success';
    transactionToastIcon.value = '✓';
    
    showTransactionToast.value = true;
    
    // 3秒后自动隐藏提示
    setTimeout(() => {
      showTransactionToast.value = false;
    }, 3000);
  }
};
</script>

<style scoped>
.inventory {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 16px;
  color: #2c3e50;
}

/* 移除了容量显示相关样式 */

.inventory-container {
  overflow-x: auto;
  overflow-y: auto; /* 添加垂直滚动 */
  max-height: calc(100vh - 250px); /* 设置最大高度，确保有足够空间显示滚动条 */
  scrollbar-width: thin; /* Firefox 滚动条样式 */
  scrollbar-color: #cbd5e0 #f8f9fa; /* Firefox 滚动条颜色 */
  flex: 1; /* 占用剩余空间 */
  display: flex;
  flex-direction: column;
}

/* 自定义滚动条样式 (Webkit浏览器) */
.inventory-container::-webkit-scrollbar {
  width: 8px;
}

.inventory-container::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.inventory-container::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 4px;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* 固定表格布局 */
}

.inventory-table th,
.inventory-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.inventory-table th {
  background-color: #f1f1f1;
  font-weight: 600;
}

.inventory-table tbody tr:hover {
  background-color: #f5f5f5;
}

.price {
  font-weight: 600;
}

.price-up {
  color: #e53e3e;
}

.price-down {
  color: #38a169;
}

.trend-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.trend-icon {
  font-weight: bold;
  font-size: 1.1rem;
}

.trend-rising-strong {
  color: #e53e3e;
  font-weight: bold;
}

.trend-rising {
  color: #e53e3e;
}

.trend-stable-high {
  color: #ed8936;
}

.trend-stable {
  color: #718096;
}

.trend-stable-low {
  color: #4299e1;
}

.trend-falling {
  color: #38a169;
}

.trend-falling-strong {
  color: #38a169;
  font-weight: bold;
}

.trend-volatile {
  color: #805ad5;
}

.profit {
  font-weight: 600;
}

.profit-positive {
  color: #e53e3e;
}

.profit-negative {
  color: #38a169;
}

.sell-btn {
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
}

.quick-sell-btn {
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: bold;
}

.sell-btn:hover,
.quick-sell-btn:hover {
  filter: brightness(1.1);
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.no-items {
  text-align: center;
  padding: 20px;
  color: #718096;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 90%;
  width: 400px;
}

.product-info {
  margin-bottom: 20px;
}

.product-info p {
  margin: 8px 0;
}

.quantity-selector {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.quantity-input {
  display: flex;
  align-items: center;
}

.quantity-input input {
  width: 60px;
  text-align: center;
  margin: 0 5px;
  padding: 5px;
}

.quantity-input button,
.max-btn {
  background-color: #e2e8f0;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

.max-btn {
  background-color: #4299e1;
  color: white;
  border-radius: 4px;
}

.total-income {
  margin-bottom: 20px;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  background-color: #4299e1;
  color: white;
}

.cancel-btn {
  background-color: #e2e8f0;
  color: #4a5568;
}

.transaction-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slide-up 0.3s ease-out, fade-out 0.3s ease-out 2.7s forwards;
}

.buy-success {
  background-color: #c6f6d5;
  border-left: 4px solid #38a169;
}

.sell-success {
  background-color: #fed7d7;
  border-left: 4px solid #e53e3e;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toast-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.toast-message {
  font-size: 0.95rem;
  color: #2d3748;
}

@keyframes slide-up {
  from {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style> 