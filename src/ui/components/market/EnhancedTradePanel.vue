<!-- 
  增强型交易面板组件
  使用优化后的状态管理和批量更新功能
-->
<template>
  <div class="enhanced-trade-panel">
    <div class="panel-header">
      <h3>{{ $t('market.tradePanel') }}</h3>
      <div class="location-info">
        <span>{{ currentLocation?.name }}</span>
        <span class="location-modifier" :class="{ 'positive': locationModifier > 1, 'negative': locationModifier < 1 }">
          {{ formatModifier(locationModifier) }}
        </span>
      </div>
    </div>
    
    <div class="trade-controls">
      <div class="quantity-control">
        <label>{{ $t('market.quantity') }}</label>
        <div class="quantity-buttons">
          <button @click="decreaseQuantity" :disabled="quantity <= 1">-</button>
          <input type="number" v-model.number="quantity" min="1" :max="maxQuantity" />
          <button @click="increaseQuantity" :disabled="quantity >= maxQuantity">+</button>
        </div>
      </div>
      
      <div class="action-buttons">
        <button 
          class="buy-button" 
          @click="executeBatchBuy" 
          :disabled="!canBuy || isProcessing"
        >
          {{ $t('market.buy') }}
        </button>
        <button 
          class="sell-button" 
          @click="executeBatchSell" 
          :disabled="!canSell || isProcessing"
        >
          {{ $t('market.sell') }}
        </button>
      </div>
          </div>
          
    <div class="product-list">
      <div 
        v-for="product in availableProducts" 
        :key="product.id"
        class="product-item"
        :class="{ 'selected': selectedProduct?.id === product.id }"
        @click="selectProduct(product)"
      >
        <div class="product-info">
          <span class="product-name">{{ product.name }}</span>
          <div class="price-info">
            <span class="price">{{ formatPrice(getProductPrice(product.id)) }}</span>
            <price-trend 
              :trend="getProductTrend(product.id).trend || 'stable'"
              :percent="product.changePercent || 0"
            />
          </div>
        </div>
        <div class="inventory-info" v-if="getInventoryQuantity(product.id) > 0">
          {{ $t('inventory.owned') }}: {{ getInventoryQuantity(product.id) }}
        </div>
      </div>
    </div>
    
    <div class="transaction-summary" v-if="selectedProduct">
      <h4>{{ $t('market.transactionSummary') }}</h4>
      <div class="summary-row">
        <span>{{ $t('market.product') }}</span>
        <span>{{ selectedProduct.name }}</span>
      </div>
      <div class="summary-row">
        <span>{{ $t('market.currentPrice') }}</span>
        <span>{{ formatPrice(currentPrice) }}</span>
      </div>
      <div class="summary-row">
        <span>{{ $t('market.quantity') }}</span>
        <span>{{ quantity }}</span>
      </div>
      <div class="summary-row total">
        <span>{{ $t('market.total') }}</span>
        <span>{{ formatPrice(totalCost) }}</span>
      </div>
      
      <div class="profit-estimate" v-if="estimatedProfit !== null">
        <span>{{ $t('market.estimatedProfit') }}</span>
        <span :class="{ 'positive': estimatedProfit > 0, 'negative': estimatedProfit < 0 }">
          {{ formatPrice(estimatedProfit) }} ({{ estimatedProfitPercent }}%)
        </span>
      </div>
    </div>
    
    <div class="transaction-result" v-if="lastResult">
      <div class="result-message" :class="{ 'success': lastResult.success, 'error': !lastResult.success }">
        {{ lastResult.message }}
        </div>
      <div class="profit-info" v-if="lastResult.profit !== undefined">
        <span>{{ $t('market.profit') }}: </span>
        <span :class="{ 'positive': lastResult.profit > 0, 'negative': lastResult.profit < 0 }">
          {{ formatPrice(lastResult.profit) }} ({{ lastResult.profitPercent }}%)
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useGameStore } from '../../../stores';
import { usePlayerStore } from '../../../stores/player';
import { useMarketStore, usePriceSystemStore } from '../../../stores/market';
import { createBatchUpdater } from '../../../infrastructure/utils';
import PriceTrend from './PriceTrend.vue';

export default {
  name: 'EnhancedTradePanel',
  components: {
    PriceTrend
  },
  props: {
    selectedProduct: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    // 使用拆分后的Store
    const gameStore = useGameStore();
    const playerStore = usePlayerStore();
    const marketStore = useMarketStore();
    const priceStore = usePriceSystemStore();
    
    // 创建批量更新工具
    const { batchUpdates } = createBatchUpdater();
    
    // 本地状态
    const quantity = ref(1);
    const lastResult = ref(null);
    const isProcessing = ref(false);

    // 计算属性
    const availableProducts = computed(() => marketStore.availableProducts);
    const currentLocation = computed(() => marketStore.currentLocation);
    const locationModifier = computed(() => {
      return currentLocation.value?.priceModifier || 1;
    });
    
    const currentPrice = computed(() => {
      if (!props.selectedProduct) return 0;
      // 确保productId是字符串类型
      const productId = String(props.selectedProduct.id);
      return priceStore.productPrices[productId]?.price || props.selectedProduct.currentPrice || 0;
    });
    
    const totalCost = computed(() => {
      return currentPrice.value * quantity.value;
    });
    
    const maxQuantity = computed(() => {
      if (!props.selectedProduct) return 1;
      
      // 买入时，根据资金和容量限制
      if (currentPrice.value > 0) {
        const maxByMoney = Math.floor(playerStore.money / currentPrice.value);
        const maxByCapacity = playerStore.availableCapacity;
        return Math.max(1, Math.min(maxByMoney, maxByCapacity));
      }
      
      // 卖出时，根据库存限制
      const inventoryItem = playerStore.inventory.find(
        item => item.productId === props.selectedProduct.id
      );
      return inventoryItem ? inventoryItem.quantity : 0;
    });
    
    const canBuy = computed(() => {
      return props.selectedProduct && 
             currentPrice.value > 0 && 
             playerStore.money >= totalCost.value &&
             playerStore.availableCapacity >= quantity.value;
    });
    
    const canSell = computed(() => {
      if (!props.selectedProduct) return false;
      
      const inventoryItem = playerStore.inventory.find(
        item => item.productId === props.selectedProduct.id
      );
      return inventoryItem && inventoryItem.quantity >= quantity.value;
    });
    
    const estimatedProfit = computed(() => {
      if (!props.selectedProduct || !canSell.value) return null;
      
      const inventoryItem = playerStore.inventory.find(
        item => item.productId === props.selectedProduct.id
      );
      if (!inventoryItem) return null;
      
      const buyPrice = inventoryItem.purchasePrice;
      const sellPrice = currentPrice.value;
      return (sellPrice - buyPrice) * quantity.value;
    });
    
    const estimatedProfitPercent = computed(() => {
      if (estimatedProfit.value === null) return '0';
      
      const inventoryItem = playerStore.inventory.find(
        item => item.productId === props.selectedProduct.id
      );
      if (!inventoryItem) return '0';
      
      const buyPrice = inventoryItem.purchasePrice;
      if (buyPrice <= 0) return '0';
      
      const percent = (estimatedProfit.value / (buyPrice * quantity.value)) * 100;
      return percent.toFixed(1);
    });
    
    // 方法
    const selectProduct = (product) => {
      emit('close'); // 通知父组件关闭面板
    };
    
    const increaseQuantity = () => {
      if (quantity.value < maxQuantity.value) {
        quantity.value++;
      }
    };
    
    const decreaseQuantity = () => {
      if (quantity.value > 1) {
        quantity.value--;
      }
    };
    
    const getProductPrice = (productId) => {
      // 确保productId是字符串类型
      const productIdStr = String(productId);
      const price = priceStore.productPrices[productIdStr]?.price;
      if (typeof price === 'number') {
        return price;
      }
      
      // 如果在priceStore中找不到价格，尝试在availableProducts中查找
      const product = availableProducts.value.find(p => String(p.id) === productIdStr);
      return product?.currentPrice || 0;
    };
    
    const getProductTrend = (productId) => {
      try {
        // 确保productId是字符串类型
        const productIdStr = String(productId);
        return priceStore.getProductPriceTrend(productIdStr);
      } catch (error) {
        console.error('获取产品趋势出错:', error);
        return { trend: 'stable', strength: 0 };
      }
    };
    
    const getInventoryQuantity = (productId) => {
      const item = playerStore.inventory.find(item => item.productId === productId);
      return item ? item.quantity : 0;
    };
    
    const formatPrice = (price) => {
      return `¥${price.toLocaleString()}`;
    };
    
    const formatModifier = (modifier) => {
      const percent = (modifier - 1) * 100;
      return percent >= 0 ? `+${percent.toFixed(0)}%` : `${percent.toFixed(0)}%`;
    };
    
    // 批量购买 - 使用批量更新减少重渲染
    const executeBatchBuy = () => {
      if (!canBuy.value || isProcessing.value) return;
      
      isProcessing.value = true;
      
      // 使用批量更新
      batchUpdates(() => {
        const result = gameStore.buyProduct(props.selectedProduct.id, quantity.value);
        lastResult.value = {
          success: result.success,
          message: result.success 
            ? `成功购买 ${quantity.value} 个 ${props.selectedProduct.name}`
            : result.message || '购买失败'
        };
      });
      
      isProcessing.value = false;
    };
    
    // 批量出售 - 使用批量更新减少重渲染
    const executeBatchSell = () => {
      if (!canSell.value || isProcessing.value) return;
      
      isProcessing.value = true;
      
      // 使用批量更新
      batchUpdates(() => {
        const result = gameStore.sellProduct(props.selectedProduct.id, quantity.value);
        lastResult.value = {
          success: result.success,
          message: result.success 
            ? `成功出售 ${quantity.value} 个 ${props.selectedProduct.name}`
            : result.message || '出售失败',
          profit: result.profit,
          profitPercent: result.profitPercent
        };
      });
      
      isProcessing.value = false;
    };
    
    // 初始化
    onMounted(() => {
      // 如果有可用商品，默认选择第一个
      if (availableProducts.value.length > 0) {
        // selectProduct(availableProducts.value[0]); // 移除此行，由父组件控制
      }
    });
    
    return {
      quantity,
      lastResult,
      isProcessing,
      availableProducts,
      currentLocation,
      locationModifier,
      currentPrice,
      totalCost,
      maxQuantity,
      canBuy,
      canSell,
      estimatedProfit,
      estimatedProfitPercent,
      selectProduct,
      increaseQuantity,
      decreaseQuantity,
      getProductPrice,
      getProductTrend,
      getInventoryQuantity,
      formatPrice,
      formatModifier,
      executeBatchBuy,
      executeBatchSell
    };
  }
};
</script>

<style scoped>
.enhanced-trade-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--color-bg-panel);
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.location-modifier {
  font-weight: bold;
  font-size: 0.9em;
}

.positive {
  color: var(--color-success);
}

.negative {
  color: var(--color-danger);
}

.trade-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.quantity-control {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.quantity-buttons {
  display: flex;
  align-items: center;
}

.quantity-buttons button {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-button);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.quantity-buttons input {
  width: 3rem;
  height: 2rem;
  text-align: center;
  margin: 0 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.buy-button, .sell-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: bold;
}

.buy-button {
  background-color: var(--color-primary);
  color: white;
}

.sell-button {
  background-color: var(--color-secondary);
  color: white;
}

.buy-button:disabled, .sell-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-radius: 0.25rem;
  background-color: var(--color-bg-card);
  cursor: pointer;
  transition: background-color 0.2s;
}

.product-item:hover {
  background-color: var(--color-bg-card-hover);
}

.product-item.selected {
  background-color: var(--color-bg-selected);
  border-left: 4px solid var(--color-primary);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-name {
  font-weight: bold;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.inventory-info {
  font-size: 0.8em;
  color: var(--color-text-secondary);
  background-color: var(--color-bg-badge);
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
}

.transaction-summary {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--color-bg-card);
  border-radius: 0.25rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.summary-row.total {
  margin-top: 1rem;
  font-weight: bold;
  border-top: 1px solid var(--color-border);
  padding-top: 0.5rem;
}

.profit-estimate {
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  font-style: italic;
}

.transaction-result {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.25rem;
}

.result-message {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.result-message.success {
  color: var(--color-success);
}

.result-message.error {
  color: var(--color-danger);
}

.profit-info {
  display: flex;
  gap: 0.5rem;
}
</style> 