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
                <div class="button-group">
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
                  <button 
                    class="quick-sell-btn-10" 
                    @click="quickSellMultiple(item, 10)"
                    title="快速卖出10个"
                    :disabled="item.quantity < 10"
                  >
                    -10
                  </button>
                </div>
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
    <transition name="fade">
      <div v-if="showTransactionToast" class="transaction-toast" :class="transactionToastClass">
        <div class="toast-content">
          <span class="toast-icon">{{ transactionToastIcon }}</span>
          <span class="toast-message">{{ transactionToastMessage }}</span>
        </div>
        <div class="toast-progress-bar"></div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGameStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import { PriceTrend } from '@/core/services/priceSystem';
import TradePanel from '@/ui/components/market/TradePanel.vue';
import { formatNumber } from '@/infrastructure/utils';

// ✅ 使用Service Composables替代直接Store访问
import { usePlayerService, useMarketService } from '@/ui/composables';

const { t } = useI18n();
const gameStore = useGameStore(); // 暂时保留用于价格数据

// ✅ Service Composables
const { player, playerInventory, loadPlayer } = usePlayerService();
const { sellProduct: sellProductService, isLoading: isMarketLoading, error: marketError } = useMarketService();

// 计算属性 - 混合使用Service和Store数据
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
    // 改进交易成功提示的格式，与市场界面一致
    let message = `已出售 ${transaction.quantity} 个 ${transaction.productName || transaction.productId}`;
    
    if (transaction.income) {
      message += `，获得 ${formatNumber(transaction.income)} 元`;
    }
    
    if (transaction.profit) {
      const profitText = transaction.profit > 0 
        ? `，盈利 ${formatNumber(transaction.profit)}` 
        : `，亏损 ${formatNumber(Math.abs(transaction.profit))}`;
      message += profitText;
    }
    
    transactionToastMessage.value = message;
    transactionToastClass.value = 'sale-success';
    transactionToastIcon.value = '💰';
    
    // 重置之前的提示（如果存在）
    showTransactionToast.value = false;
    
    // 延迟一帧后显示，确保动画正确播放
    requestAnimationFrame(() => {
      showTransactionToast.value = true;
      
      // 3秒后自动隐藏提示
      setTimeout(() => {
        showTransactionToast.value = false;
      }, 3000);
    });
  }
};

const calculateChangePercent = (item) => {
  const currentPrice = getCurrentPrice(item);
  const purchasePrice = item.purchasePrice;
  
  if (purchasePrice === 0) return 0;
  
  return ((currentPrice - purchasePrice) / purchasePrice) * 100;
};

const quickSell = async (item) => {
  if (item.quantity > 0) {
    // ✅ 使用Service层的销售方法
    const result = await sellProductService(item.productId, 1);
    
    if (result.success) {
      // 改进交易成功提示的格式，与市场界面一致
      let message = `已出售 1 个 ${item.name}`;
      
      if (result.income) {
        message += `，获得 ${formatNumber(result.income)} 元`;
      }
      
      if (result.profit) {
        const profitText = result.profit > 0 
          ? `，盈利 ${formatNumber(result.profit)}` 
          : `，亏损 ${formatNumber(Math.abs(result.profit))}`;
        message += profitText;
      }
      
      transactionToastMessage.value = message;
      transactionToastClass.value = 'sale-success';
      transactionToastIcon.value = '💰';
      
      // 重置之前的提示（如果存在）
      showTransactionToast.value = false;
      
      // 延迟一帧后显示，确保动画正确播放
      requestAnimationFrame(() => {
        showTransactionToast.value = true;
        
        // 3秒后自动隐藏提示
        setTimeout(() => {
          showTransactionToast.value = false;
        }, 3000);
      });

      // ✅ 刷新玩家数据
      await loadPlayer();
    }
  }
};

// 添加快速卖出多个物品的方法
const quickSellMultiple = async (item, quantity) => {
  // 确保不会卖出超过拥有的数量
  const sellAmount = Math.min(item.quantity, quantity);
  
  if (sellAmount > 0) {
    // ✅ 使用Service层的销售方法
    const result = await sellProductService(item.productId, sellAmount);
    
    if (result.success) {
      // 改进交易成功提示的格式，与市场界面一致
      let message = `已出售 ${sellAmount} 个 ${item.name}`;
      
      if (result.income) {
        message += `，获得 ${formatNumber(result.income)} 元`;
      }
      
      if (result.profit) {
        const profitText = result.profit > 0 
          ? `，盈利 ${formatNumber(result.profit)}` 
          : `，亏损 ${formatNumber(Math.abs(result.profit))}`;
        message += profitText;
      }
      
      transactionToastMessage.value = message;
      transactionToastClass.value = 'sale-success';
      transactionToastIcon.value = '💰';
      
      // 重置之前的提示（如果存在）
      showTransactionToast.value = false;
      
      // 延迟一帧后显示，确保动画正确播放
      requestAnimationFrame(() => {
        showTransactionToast.value = true;
        
        // 3秒后自动隐藏提示
        setTimeout(() => {
          showTransactionToast.value = false;
        }, 3000);
      });

      // ✅ 刷新玩家数据
      await loadPlayer();
    }
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

.inventory-container {
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 250px);
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f8f9fa;
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
  table-layout: fixed;
}

.inventory-table th,
.inventory-table td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.inventory-table th {
  background-color: #f1f1f1;
  font-weight: 600;
  color: #4a5568;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
}

.inventory-table tbody tr:hover {
  background-color: #f5f5f5;
}

.inventory-table th:last-child,
.inventory-table td:last-child {
  width: 200px;
  text-align: left;
}

.price {
  font-weight: 700;
  font-size: 1.1rem;
  color: #2c3e50;
  background: -webkit-linear-gradient(45deg, #2c3e50, #4a6fa5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.price-up {
  color: #e53e3e;
  background: -webkit-linear-gradient(45deg, #c0392b, #e74c3c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.price-down {
  color: #38a169;
  background: -webkit-linear-gradient(45deg, #27ae60, #2ecc71);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.trend-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  border-radius: 8px;
  background-color: rgba(0,0,0,0.02);
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
  font-family: var(--font-family-numbers, 'Arial', sans-serif);
  font-size: 0.95rem;
  padding: 4px 8px;
  border-radius: 20px;
  display: inline-block;
  text-align: center;
}

.profit-positive {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.profit-negative {
  background-color: rgba(46, 204, 113, 0.1);
  color: #27ae60;
}

.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 0.8rem;
  min-height: 36px;
  justify-content: flex-start;
}

.button-group {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
}

.button-group:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.12);
}

.sell-btn {
  padding: 0.35rem 0.85rem;
  background-color: #e67e22;
  color: white;
  border: none;
  border-radius: 6px 0 0 6px;
  cursor: pointer;
  min-width: 60px;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.sell-btn:hover:not(:disabled) {
  background-color: #d35400;
}

.sell-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.quick-sell-btn {
  padding: 0.35rem 0.5rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 0;
  cursor: pointer;
  min-width: 40px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.quick-sell-btn:hover:not(:disabled) {
  background-color: #c0392b;
}

.quick-sell-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.quick-sell-btn-10 {
  padding: 0.35rem 0.5rem;
  background-color: #c0392b;
  color: white;
  border: none;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  min-width: 40px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.quick-sell-btn-10:hover:not(:disabled) {
  background-color: #a93226;
}

.quick-sell-btn-10:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.no-items {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  font-style: italic;
  font-size: 1.1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 1rem;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
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
  z-index: 1000;
}

.transaction-toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 10px;
  background-color: rgba(44, 62, 80, 0.9);
  color: white;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  min-width: 220px;
  backdrop-filter: blur(4px);
  animation: toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  text-align: center;
  overflow: hidden;
  pointer-events: none;
}

/* 进度条动画 */
.toast-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: rgba(255, 255, 255, 0.3);
}

.toast-progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: rgba(255, 255, 255, 0.7);
  animation: progress 3s linear forwards;
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

.toast-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.toast-icon {
  font-size: 18px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.toast-message {
  font-size: 0.95rem;
  color: white;
  font-weight: 500;
  letter-spacing: 0.2px;
}

/* 淡入淡出过渡效果 */
.fade-enter-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

.fade-enter-to, .fade-leave-from {
  opacity: 1;
  transform: translate(-50%, 0);
}

@keyframes toast-in {
  from {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@keyframes toast-out {
  from {
    transform: translate(-50%, 0);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -20px);
    opacity: 0;
  }
}

.buy-success {
  background-color: rgba(46, 204, 113, 0.9);
  border-top: 3px solid #2ecc71;
}

.buy-success .toast-icon {
  background-color: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.sale-success {
  background-color: rgba(44, 62, 80, 0.9);
  border-top: 3px solid #3498db;
}

.sale-success .toast-icon {
  background-color: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.purchase-failed {
  background-color: rgba(44, 62, 80, 0.9);
  border-top: 3px solid #e74c3c;
}

.purchase-failed .toast-icon {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}
</style> 