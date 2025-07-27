<template>
  <div class="enhanced-trade-panel">
    <!-- 交易类型选择器 -->
    <div class="panel-header">
      <h3>{{ selectedProduct ? selectedProduct.name : '交易' }}</h3>
    <div class="trade-type-selector">
      <button 
        :class="['type-btn', { active: tradeType === 'buy' }]" 
        @click="setTradeType('buy')"
      >
          购买
      </button>
      <button 
        :class="['type-btn', { active: tradeType === 'sell' }]" 
        @click="setTradeType('sell')"
      >
          出售
      </button>
      </div>
    </div>
    
    <!-- 当前选中的商品信息 -->
    <div v-if="selectedProduct" class="trade-detail">
      <div class="price-info">
        <div class="current-price">
          <span>当前价格:</span>
          <span class="price-value">{{ formatPrice(getCurrentPrice(selectedProduct.id)) }}</span>
        </div>
        
        <mini-price-chart 
          :history="getPriceHistory(selectedProduct.id)"
          :height="40"
        />
      </div>
      
      <!-- 添加预计收益/成本信息 -->
      <div class="prediction-info" v-if="tradeType === 'buy'">
        <div class="prediction-badge" :class="getPredictionClass(selectedProduct)">
          <span class="prediction-icon">{{ getPredictionIcon(selectedProduct) }}</span>
          <span>{{ getPredictionText(selectedProduct) }}</span>
        </div>
      </div>
      
      <div class="trade-form">
        <div class="form-row">
        <div class="quantity-control">
          <button @click="decreaseQuantity">-</button>
          <input 
            v-model.number="quantity" 
            type="number" 
            min="1" 
            :max="maxTradeQuantity"
          />
          <button @click="increaseQuantity">+</button>
          </div>
          
          <div class="quick-quantity">
            <button @click="setQuantity(maxTradeQuantity / 4)">25%</button>
            <button @click="setQuantity(maxTradeQuantity / 2)">50%</button>
            <button @click="setQuantity(maxTradeQuantity)">最大</button>
          </div>
        </div>
        
        <div class="trade-summary">
          <div class="summary-row">
            <span>总计:</span>
            <span class="total-value">{{ formatPrice(totalCost) }}</span>
          </div>
          
          <div v-if="tradeType === 'sell' && getPurchasePrice()" class="summary-row">
            <span>预计利润:</span>
            <span :class="['profit-value', profitClass]">
              {{ formatPrice(estimatedProfit) }}
              ({{ profitPercent }}%)
            </span>
          </div>
          
          <!-- 添加持有量信息 -->
          <div v-if="inventoryQuantity > 0" class="summary-row inventory-info">
            <span>当前持有:</span>
            <span>{{ inventoryQuantity }} 个</span>
          </div>
          
          <!-- 添加平均购买价格信息 -->
          <div v-if="tradeType === 'sell' && getPurchasePrice()" class="summary-row avg-price-info">
            <span>平均买入价:</span>
            <span>{{ formatPrice(getPurchasePrice()) }}</span>
          </div>
        </div>
        
        <div class="action-buttons">
          <button class="cancel-btn" @click="$emit('close')">取消</button>
        <button 
          class="execute-trade-btn" 
          :disabled="!canTrade" 
          @click="executeTrade"
        >
          {{ tradeType === 'buy' ? '购买' : '出售' }}
        </button>
        </div>
      </div>
    </div>
    
    <!-- 交易结果反馈 - 移除旧版本的内部反馈 -->
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useGameStore } from '../../../stores';
import MiniPriceChart from './MiniPriceChart.vue';
import { formatNumber, formatCurrency } from '@/infrastructure/utils/formatUtils';
import { handleError, ErrorType, ErrorSeverity } from '../../../infrastructure/utils/errorHandler';
import eventEmitter from '@/infrastructure/eventEmitter';

const props = defineProps({
  selectedProduct: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);

// 状态
const tradeType = ref('buy');
const selectedProduct = ref(props.selectedProduct);
const quantity = ref(1);

// 获取store
const gameStore = useGameStore();

// 监听props变化，同步到本地状态
watch(() => props.selectedProduct, (newProduct) => {
  selectedProduct.value = newProduct;
});

// 计算属性
const maxTradeQuantity = computed(() => {
  if (!selectedProduct.value) return 0;
  
  if (tradeType.value === 'buy') {
    const price = selectedProduct.value.currentPrice || getCurrentPrice(selectedProduct.value.id);
    const maxByMoney = Math.floor(gameStore.player.money / price);
    const maxBySpace = gameStore.player.capacity - gameStore.player.inventoryUsed;
    return Math.max(0, Math.min(maxByMoney, maxBySpace));
  } else {
    // 出售时，最大数量为库存中该商品的总数量
    return inventoryQuantity.value;
  }
});

// 总成本
const totalCost = computed(() => {
  if (!selectedProduct.value) return 0;
  const price = selectedProduct.value.currentPrice || getCurrentPrice(selectedProduct.value.id);
  return price * quantity.value;
});

const estimatedProfit = computed(() => {
  if (tradeType.value !== 'sell' || !selectedProduct.value) return 0;
  
  const currentPrice = getCurrentPrice(selectedProduct.value.id);
  const purchasePrice = getPurchasePrice();
  if (!purchasePrice) return 0;
  
  return quantity.value * (currentPrice - purchasePrice);
});

const profitPercent = computed(() => {
  const purchasePrice = getPurchasePrice();
  if (!purchasePrice) return '0';
  
  const currentPrice = getCurrentPrice(selectedProduct.value?.id);
  const percent = ((currentPrice / purchasePrice - 1) * 100).toFixed(1);
  return percent;
});

const profitClass = computed(() => {
  const profit = parseFloat(profitPercent.value);
  if (profit > 0) return 'profit-positive';
  if (profit < 0) return 'profit-negative';
  return '';
});

// 是否可以交易
const canTrade = computed(() => {
  if (!selectedProduct.value || quantity.value <= 0) return false;
  
  if (tradeType.value === 'buy') {
    // 购买条件：有足够的钱和背包空间
    const price = selectedProduct.value.currentPrice || getCurrentPrice(selectedProduct.value.id);
    const totalCost = price * quantity.value;
    
    // 检查金钱是否足够
    if (totalCost > gameStore.player.money) return false;
    
    // 检查背包空间是否足够
    const freeSpace = gameStore.player.capacity - gameStore.player.inventoryUsed;
    if (quantity.value > freeSpace) return false;
    
    return true;
  } else {
    // 出售条件：库存中有足够的商品数量
    return inventoryQuantity.value >= quantity.value;
  }
});

// 获取库存中该商品的数量
const inventoryQuantity = computed(() => {
  if (!selectedProduct.value) return 0;
  
  return gameStore.player.inventory
    .filter(item => item.productId === selectedProduct.value.id)
    .reduce((total, item) => total + item.quantity, 0);
});

// 获取该商品的平均购买价格
const getPurchasePrice = () => {
  if (!selectedProduct.value) return 0;
  
  const inventoryItems = gameStore.player.inventory
    .filter(item => item.productId === selectedProduct.value.id);
  
  if (inventoryItems.length === 0) return 0;
  
  const totalCost = inventoryItems.reduce(
    (sum, item) => sum + (item.purchasePrice * item.quantity), 0
  );
  const totalQuantity = inventoryItems.reduce(
    (sum, item) => sum + item.quantity, 0
  );
  
  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
};

// 获取价格趋势预测
const getPredictionClass = (product) => {
  if (!product) return '';
  const trend = gameStore.productPrices[product.id]?.trend || 'stable';
  
  if (trend === 'rising') return 'prediction-up';
  if (trend === 'falling') return 'prediction-down';
  return 'prediction-stable';
};

const getPredictionIcon = (product) => {
  if (!product) return '?';
  const trend = gameStore.productPrices[product.id]?.trend || 'stable';
  
  if (trend === 'rising') return '📈';
  if (trend === 'falling') return '📉';
  return '📊';
};

const getPredictionText = (product) => {
  if (!product) return '无法预测';
  const trend = gameStore.productPrices[product.id]?.trend || 'stable';
  
  if (trend === 'rising') return '价格可能上涨，建议购买';
  if (trend === 'falling') return '价格可能下跌，谨慎购买';
  return '价格相对稳定';
};

// 交易类型切换
const setTradeType = (type) => {
  tradeType.value = type;
  // 重置数量
  quantity.value = 1;
};

function increaseQuantity() {
  quantity.value = Math.min(quantity.value + 1, maxTradeQuantity.value);
}

function decreaseQuantity() {
  quantity.value = Math.max(1, quantity.value - 1);
}

function setQuantity(value) {
  quantity.value = Math.max(1, Math.floor(value));
}

// 修改getCurrentPrice函数，确保它始终返回正确的价格
function getCurrentPrice(productId) {
  if (!productId) return 0;
  
  // 将productId转换为字符串以确保一致的比较
  const productIdStr = String(productId);
  
  // 首先尝试从gameStore中获取价格
  const price = gameStore.getCurrentProductPrice(productIdStr);
  
  // 如果获取到价格是0，尝试从availableProducts中找到商品的当前价格
  if (price === 0 && selectedProduct.value) {
    // 如果selectedProduct存在且ID匹配，使用其currentPrice
    if (String(selectedProduct.value.id) === productIdStr && selectedProduct.value.currentPrice) {
      return selectedProduct.value.currentPrice;
    }
    
    // 尝试从product对象获取basePrice作为备选
    const product = gameStore.marketStore.products.find(p => String(p.id) === productIdStr);
    if (product && product.basePrice) {
      return product.basePrice;
    }
  }
  
  return price;
}

function getPriceHistory(productId) {
  return gameStore.productPrices[productId]?.history || [];
}

function formatPrice(price) {
  return formatCurrency(price);
}

// 修改执行交易的方法
function executeTrade() {
  if (!canTrade.value || !selectedProduct.value) return;
  
  try {
    // 确保当前价格不为0
    const currentPrice = getCurrentPrice(selectedProduct.value.id);
    if (currentPrice <= 0) {
      showFeedbackMessage('error', '无法确定商品价格，请稍后再试');
      return;
    }
    
    let result;
    
    if (tradeType.value === 'buy') {
      // 购买操作
      result = gameStore.buyProduct(selectedProduct.value.id, quantity.value);
      
      if (result.success) {
        showFeedbackMessage('success', `已购买 ${quantity.value} 个 ${selectedProduct.value.name}`);
      } else {
        showFeedbackMessage('error', result.message || '购买失败');
      }
    } else {
      // 出售操作
      result = gameStore.sellProduct(selectedProduct.value.id, quantity.value);
    
      if (result.success) {
        let message = `已出售 ${quantity.value} 个 ${selectedProduct.value.name}`;
        
        if (result.income) {
          message += `，获得 ${formatNumber(result.income)} 元`;
        }
        
        if (result.profit) {
          const profitText = result.profit > 0 
            ? `，盈利 ${formatNumber(result.profit)}` 
            : `，亏损 ${formatNumber(Math.abs(result.profit))}`;
          message += profitText;
        }
        
        showFeedbackMessage(
          result.profit >= 0 ? 'success' : 'warning',
          message
        );
      } else {
        showFeedbackMessage('error', result.message || '出售失败');
      }
    }
    
    // 重置数量
    quantity.value = 1;
    
    // 完成交易后关闭面板
    emit('close');
  } catch (error) {
    console.error('交易执行出错:', error);
    showFeedbackMessage('error', '交易过程中发生错误');
  }
}

// 修改显示反馈消息的函数，使用事件发射器通知父组件显示全局提示
const showFeedbackMessage = (type, message) => {
  // 使用事件发射器发送事件
  eventEmitter.emit('show:transaction_toast', {
    message,
    type,
    icon: tradeType.value === 'buy' 
      ? (type === 'success' ? '✓' : type === 'warning' ? '⚠️' : type === 'error' ? '✗' : '📣')
      : '💰', // 出售时始终使用💰图标，与快速出售保持一致
    class: type === 'success' 
      ? (tradeType.value === 'buy' ? 'purchase-success' : 'sale-success') 
      : (tradeType.value === 'sell' && type === 'warning' ? 'sale-success' : 'purchase-failed')
      // 确保出售亏损时也使用sale-success类
  });
};

// 监听选中商品变化
watch(selectedProduct, () => {
  quantity.value = 1;
});
</script>

<style scoped>
.enhanced-trade-panel {
  display: flex;
  flex-direction: column;
  padding: 0;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
  will-change: transform, opacity;
}

/* 移除panel-enter动画，由父组件控制 */

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #4a6fa5;
  color: white;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.trade-type-selector {
  display: flex;
  gap: 0.5rem;
}

.type-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid #fff;
  border-radius: 4px;
  background-color: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.type-btn.active {
  background-color: white;
  color: #4a6fa5;
  font-weight: bold;
}

.trade-detail {
  padding: 1rem;
  background-color: #fff;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.price-info {
  margin-bottom: 1rem;
}

.current-price {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.price-value {
  font-weight: bold;
  color: #4a6fa5;
}

/* 预测信息样式 */
.prediction-info {
  margin-bottom: 1rem;
}

.prediction-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  background-color: #f0f0f0;
}

.prediction-icon {
  font-size: 1.2rem;
}

.prediction-up {
  background-color: rgba(46, 204, 113, 0.15);
  color: #27ae60;
  border-left: 3px solid #27ae60;
}

.prediction-down {
  background-color: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
  border-left: 3px solid #e74c3c;
}

.prediction-stable {
  background-color: rgba(52, 152, 219, 0.15);
  color: #3498db;
  border-left: 3px solid #3498db;
}

.trade-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.quantity-control button {
  width: 1.8rem;
  height: 1.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  font-weight: bold;
}

.quantity-control input {
  width: 3rem;
  padding: 0.3rem;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.quick-quantity {
  display: flex;
  gap: 0.25rem;
}

.quick-quantity button {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
  cursor: pointer;
}

.trade-summary {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.9rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.total-value {
  font-weight: bold;
  color: #2c3e50;
}

.profit-positive {
  color: #28a745;
}

.profit-negative {
  color: #dc3545;
}

/* 库存信息和平均价格信息样式 */
.inventory-info {
  color: #6c757d;
  font-size: 0.85rem;
  padding-top: 0.3rem;
  border-top: 1px dashed #ddd;
}

.avg-price-info {
  color: #6c757d;
  font-size: 0.85rem;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.cancel-btn {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #e9ecef;
}

.execute-trade-btn {
  flex: 2;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  background-color: #4a6fa5;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.execute-trade-btn:hover:not(:disabled) {
  background-color: #3d5d8a;
  transform: translateY(-1px);
}

.execute-trade-btn:disabled {
  background-color: #adb5bd;
  cursor: not-allowed;
}

/* 移除交易反馈相关样式 */
</style> 