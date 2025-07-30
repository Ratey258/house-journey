<template>
  <div class="trade-panel">
    <div class="panel-header">
      <h3 class="panel-title">{{ product.name }}</h3>
      <button class="close-btn" @click="close">×</button>
    </div>

    <div class="product-details">
      <div class="product-image-container">
        <img :src="getProductImage()" alt="商品图片" class="product-image">
        <div class="product-badge" v-if="product.isSpecial">特色商品</div>
      </div>

      <div class="product-info">
        <div class="price-info">
          <div class="current-price">
            <span class="label">当前价格</span>
            <span class="value">¥{{ formatNumber(product.currentPrice) }}</span>
          </div>

          <div class="price-trend">
            <div class="trend-indicator" :class="getTrendClass(product.trend)">
              <span class="trend-icon">{{ getTrendIcon(product.trend) }}</span>
              <span class="trend-text">{{ getTrendText(product.trend) }}</span>
            </div>

            <div class="price-change" :class="getChangeClass(product.changePercent)">
              {{ formatChange(product.changePercent) }}%
            </div>
          </div>
        </div>

        <div class="price-history">
          <h4>价格历史</h4>
          <div class="price-chart">
            <div
              v-for="(price, index) in priceHistory"
              :key="index"
              class="price-bar"
              :style="{
                height: `${getBarHeight(price)}%`,
                backgroundColor: getBarColor(price, product.currentPrice)
              }"
              :title="`¥${formatNumber(price)}`"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="trade-actions">
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'buy' }"
          @click="activeTab = 'buy'"
        >
          买入
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'sell' }"
          @click="activeTab = 'sell'"
          :disabled="!canSell"
        >
          卖出
        </button>
      </div>

      <div class="tab-content">
        <!-- 买入面板 -->
        <div v-if="activeTab === 'buy'" class="buy-panel">
          <div class="player-resources">
            <div class="resource">
              <span class="label">可用资金</span>
              <span class="value">¥{{ formatNumber(player.money) }}</span>
            </div>
            <div class="resource">
              <span class="label">可用空间</span>
              <span class="value">{{ player.capacity - player.inventoryUsed }}</span>
            </div>
          </div>

          <div class="quantity-control">
            <div class="quantity-slider-container">
              <input
                type="range"
                v-model="buyQuantity"
                :min="1"
                :max="maxBuyQuantity"
                :disabled="maxBuyQuantity <= 0"
                class="quantity-slider"
              >
              <div class="slider-labels">
                <span>1</span>
                <span>{{ Math.floor(maxBuyQuantity / 2) }}</span>
                <span>{{ maxBuyQuantity }}</span>
              </div>
            </div>

            <div class="quantity-input">
              <button @click="decrementBuyQuantity" :disabled="buyQuantity <= 1 || maxBuyQuantity <= 0">-</button>
              <input
                type="number"
                v-model="buyQuantity"
                :min="1"
                :max="maxBuyQuantity"
                :disabled="maxBuyQuantity <= 0"
              />
              <button @click="incrementBuyQuantity" :disabled="buyQuantity >= maxBuyQuantity || maxBuyQuantity <= 0">+</button>
            </div>

            <div class="quantity-presets">
              <button @click="setBuyQuantity(1)" :disabled="maxBuyQuantity < 1">1</button>
              <button @click="setBuyQuantity(5)" :disabled="maxBuyQuantity < 5">5</button>
              <button @click="setBuyQuantity(10)" :disabled="maxBuyQuantity < 10">10</button>
              <button @click="setBuyQuantity(maxBuyQuantity)" :disabled="maxBuyQuantity <= 0">最大</button>
            </div>
          </div>

          <div class="transaction-summary">
            <div class="summary-item">
              <span class="label">数量</span>
              <span class="value">{{ buyQuantity }}</span>
            </div>
            <div class="summary-item">
              <span class="label">单价</span>
              <span class="value">¥{{ formatNumber(product.currentPrice) }}</span>
            </div>
            <div class="summary-item total">
              <span class="label">总价</span>
              <span class="value">¥{{ formatNumber(buyTotalCost) }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button
              class="action-btn buy-btn"
              @click="executeBuy"
              :disabled="!canBuy || buyQuantity <= 0"
            >
              确认买入
            </button>
          </div>
        </div>

        <!-- 卖出面板 -->
        <div v-if="activeTab === 'sell'" class="sell-panel">
          <div class="player-resources">
            <div class="resource">
              <span class="label">持有数量</span>
              <span class="value">{{ ownedQuantity }}</span>
            </div>
            <div class="resource">
              <span class="label">购买价格</span>
              <span class="value">¥{{ formatNumber(ownedItem ? ownedItem.purchasePrice : 0) }}</span>
            </div>
          </div>

          <div class="profit-preview" :class="getProfitClass()">
            <span class="label">预计盈亏</span>
            <span class="value">{{ getProfitText() }}</span>
          </div>

          <div class="quantity-control">
            <div class="quantity-slider-container">
              <input
                type="range"
                v-model="sellQuantity"
                :min="1"
                :max="ownedQuantity"
                :disabled="!canSell"
                class="quantity-slider"
              >
              <div class="slider-labels">
                <span>1</span>
                <span>{{ Math.floor(ownedQuantity / 2) }}</span>
                <span>{{ ownedQuantity }}</span>
              </div>
            </div>

            <div class="quantity-input">
              <button @click="decrementSellQuantity" :disabled="sellQuantity <= 1 || !canSell">-</button>
              <input
                type="number"
                v-model="sellQuantity"
                :min="1"
                :max="ownedQuantity"
                :disabled="!canSell"
              />
              <button @click="incrementSellQuantity" :disabled="sellQuantity >= ownedQuantity || !canSell">+</button>
            </div>

            <div class="quantity-presets">
              <button @click="setSellQuantity(1)" :disabled="!canSell">1</button>
              <button @click="setSellQuantity(5)" :disabled="ownedQuantity < 5">5</button>
              <button @click="setSellQuantity(10)" :disabled="ownedQuantity < 10">10</button>
              <button @click="setSellQuantity(ownedQuantity)" :disabled="!canSell">全部</button>
            </div>
          </div>

          <div class="transaction-summary">
            <div class="summary-item">
              <span class="label">数量</span>
              <span class="value">{{ sellQuantity }}</span>
            </div>
            <div class="summary-item">
              <span class="label">单价</span>
              <span class="value">¥{{ formatNumber(product.currentPrice) }}</span>
            </div>
            <div class="summary-item total">
              <span class="label">总收入</span>
              <span class="value">¥{{ formatNumber(sellTotalIncome) }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button
              class="action-btn sell-btn"
              @click="executeSell"
              :disabled="!canSell || sellQuantity <= 0"
            >
              确认卖出
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useGameStore } from '../../../stores';
import { PriceTrend, getTrendDescription } from '../../../core/services/priceSystem';
import { formatNumber, formatPercentChange } from '@/infrastructure/utils';

export default {
  name: 'TradePanel',
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    const gameStore = useGameStore();

    // 响应式状态
    const activeTab = ref('buy');
    const buyQuantity = ref(1);
    const sellQuantity = ref(1);

    // 计算属性
    const player = computed(() => gameStore.player);
    const priceHistory = computed(() => gameStore.getProductPriceHistory(props.product.id) || []);

    const maxBuyQuantity = computed(() => {
      const maxByMoney = Math.floor(player.value.money / props.product.currentPrice);
      const maxByCapacity = player.value.capacity - player.value.inventoryUsed;
      return Math.max(0, Math.min(maxByMoney, maxByCapacity));
    });

    const buyTotalCost = computed(() => {
      return props.product.currentPrice * buyQuantity.value;
    });

    const ownedItem = computed(() => {
      return player.value.inventory.find(item => item.productId === props.product.id);
    });

    const ownedQuantity = computed(() => {
      return ownedItem.value ? ownedItem.value.quantity : 0;
    });

    const canSell = computed(() => {
      return ownedQuantity.value > 0;
    });

    const canBuy = computed(() => {
      return maxBuyQuantity.value > 0;
    });

    const sellTotalIncome = computed(() => {
      return props.product.currentPrice * sellQuantity.value;
    });

    // 方法
    const formatChange = (percent) => {
      return formatPercentChange(percent);
    };

    const getTrendText = (trend) => {
      return getTrendDescription(trend);
    };

    const getTrendIcon = (trend) => {
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

    const getTrendClass = (trend) => {
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

    const getChangeClass = (percent) => {
      if (percent > 3) return 'change-up-strong';
      if (percent > 0) return 'change-up';
      if (percent < -3) return 'change-down-strong';
      if (percent < 0) return 'change-down';
      return 'change-neutral';
    };

    const getProductImage = () => {
      const categoryImages = {
        'food': 'food.png',
        'electronics': 'electronics.png',
        'clothing': 'clothing.png',
        'luxury': 'luxury.png',
        'daily': 'daily.png'
      };

      const category = props.product.category || 'daily';
      return require(`@/assets/images/products/${categoryImages[category]}`);
    };

    const getBarHeight = (price) => {
      const prices = [props.product.currentPrice, ...priceHistory.value];
      const max = Math.max(...prices);
      const min = Math.min(...prices);
      const range = max - min;

      if (range === 0) return 50; // 如果所有价格都相同，返回中间高度

      return ((price - min) / range) * 80 + 10; // 保证最低高度为10%，最高为90%
    };

    const getBarColor = (price, currentPrice) => {
      if (price > currentPrice) return '#e53e3e'; // 红色，高于当前价格
      if (price < currentPrice) return '#38a169'; // 绿色，低于当前价格
      return '#4299e1'; // 蓝色，当前价格
    };

    const getProfitClass = () => {
      if (!ownedItem.value) return '';

      const diff = props.product.currentPrice - ownedItem.value.purchasePrice;
      if (diff > 0) return 'profit-positive';
      if (diff < 0) return 'profit-negative';
      return '';
    };

    const getProfitText = () => {
      if (!ownedItem.value) return '';

      const diff = (props.product.currentPrice - ownedItem.value.purchasePrice) * sellQuantity.value;
      const percentage = ((props.product.currentPrice / ownedItem.value.purchasePrice) - 1) * 100;

      const sign = diff > 0 ? '+' : '';
      return `${sign}¥${formatNumber(diff)} (${sign}${percentage.toFixed(1)}%)`;
    };

    const incrementBuyQuantity = () => {
      if (buyQuantity.value < maxBuyQuantity.value) {
        buyQuantity.value++;
      }
    };

    const decrementBuyQuantity = () => {
      if (buyQuantity.value > 1) {
        buyQuantity.value--;
      }
    };

    const setBuyQuantity = (quantity) => {
      buyQuantity.value = Math.min(quantity, maxBuyQuantity.value);
    };

    const incrementSellQuantity = () => {
      if (sellQuantity.value < ownedQuantity.value) {
        sellQuantity.value++;
      }
    };

    const decrementSellQuantity = () => {
      if (sellQuantity.value > 1) {
        sellQuantity.value--;
      }
    };

    const setSellQuantity = (quantity) => {
      sellQuantity.value = Math.min(quantity, ownedQuantity.value);
    };

    const executeBuy = () => {
      if (buyQuantity.value > 0) {
        gameStore.buyProduct(props.product.id, buyQuantity.value);
        emit('transaction-complete', {
          type: 'buy',
          productId: props.product.id,
          quantity: buyQuantity.value,
          price: props.product.currentPrice
        });
      }
    };

    const executeSell = () => {
      if (sellQuantity.value > 0 && canSell.value) {
        gameStore.sellProduct(props.product.id, sellQuantity.value);
        emit('transaction-complete', {
          type: 'sell',
          productId: props.product.id,
          quantity: sellQuantity.value,
          price: props.product.currentPrice
        });
      }
    };

    const close = () => {
      emit('close');
    };

    return {
      activeTab,
      buyQuantity,
      sellQuantity,
      player,
      priceHistory,
      maxBuyQuantity,
      buyTotalCost,
      ownedItem,
      ownedQuantity,
      canSell,
      canBuy,
      sellTotalIncome,
      formatNumber,
      formatChange,
      getTrendText,
      getTrendIcon,
      getTrendClass,
      getChangeClass,
      getProductImage,
      getBarHeight,
      getBarColor,
      getProfitClass,
      getProfitText,
      incrementBuyQuantity,
      decrementBuyQuantity,
      setBuyQuantity,
      incrementSellQuantity,
      decrementSellQuantity,
      setSellQuantity,
      executeBuy,
      executeSell,
      close
    };
  }
};
</script>

<style scoped>
.trade-panel {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 600px;
  overflow: hidden;
}

.panel-header {
  background-color: #4299e1;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.product-details {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #edf2f7;
}

.product-image-container {
  width: 120px;
  height: 120px;
  position: relative;
  margin-right: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-badge {
  position: absolute;
  top: 8px;
  left: 0;
  background-color: #ecc94b;
  color: #744210;
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 0 4px 4px 0;
  font-weight: bold;
}

.product-info {
  flex: 1;
}

.price-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.current-price {
  display: flex;
  flex-direction: column;
}

.current-price .label {
  font-size: 0.9rem;
  color: #718096;
  margin-bottom: 5px;
}

.current-price .value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2d3748;
}

.price-trend {
  text-align: right;
}

.trend-indicator {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 5px;
}

.trend-icon {
  font-weight: bold;
  margin-right: 5px;
}

.price-change {
  font-weight: 600;
}

.trend-rising-strong, .change-up-strong, .trend-rising, .change-up {
  color: #e53e3e;
}

.trend-stable-high {
  color: #ed8936;
}

.trend-stable, .change-neutral {
  color: #718096;
}

.trend-stable-low {
  color: #4299e1;
}

.trend-falling, .change-down, .trend-falling-strong, .change-down-strong {
  color: #38a169;
}

.trend-volatile {
  color: #805ad5;
}

.price-history {
  margin-top: 15px;
}

.price-history h4 {
  font-size: 0.9rem;
  color: #718096;
  margin: 0 0 10px;
}

.price-chart {
  display: flex;
  align-items: flex-end;
  height: 50px;
  gap: 3px;
}

.price-bar {
  flex: 1;
  background-color: #4299e1;
  border-radius: 2px 2px 0 0;
  transition: height 0.3s ease;
}

.trade-actions {
  padding: 20px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #edf2f7;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 1rem;
  cursor: pointer;
  color: #718096;
  transition: all 0.2s ease;
}

.tab-btn.active {
  color: #4299e1;
  border-bottom-color: #4299e1;
  font-weight: 600;
}

.tab-btn:disabled {
  color: #cbd5e0;
  cursor: not-allowed;
}

.player-resources {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.resource {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.resource .label {
  font-size: 0.8rem;
  color: #718096;
  margin-bottom: 3px;
}

.resource .value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
}

.profit-preview {
  background-color: #f7fafc;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profit-preview .label {
  font-size: 0.9rem;
  color: #718096;
}

.profit-preview .value {
  font-weight: 600;
}

.profit-preview.profit-positive .value {
  color: #e53e3e;
}

.profit-preview.profit-negative .value {
  color: #38a169;
}

.quantity-control {
  margin-bottom: 20px;
}

.quantity-slider-container {
  margin-bottom: 10px;
}

.quantity-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e2e8f0;
  border-radius: 3px;
  outline: none;
}

.quantity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #718096;
  margin-top: 5px;
}

.quantity-input {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.quantity-input button {
  width: 30px;
  height: 30px;
  background-color: #e2e8f0;
  border: none;
  border-radius: 4px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.quantity-input input {
  width: 80px;
  text-align: center;
  margin: 0 10px;
  padding: 5px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.quantity-presets {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.quantity-presets button {
  padding: 5px 10px;
  background-color: #e2e8f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.quantity-presets button:hover:not(:disabled) {
  background-color: #cbd5e0;
}

.quantity-presets button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.transaction-summary {
  background-color: #f7fafc;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item .label {
  color: #718096;
}

.summary-item .value {
  font-weight: 600;
  color: #2d3748;
}

.summary-item.total {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
}

.summary-item.total .label,
.summary-item.total .value {
  font-weight: bold;
  font-size: 1.1rem;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.action-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.buy-btn {
  background-color: #4299e1;
  color: white;
}

.buy-btn:hover:not(:disabled) {
  background-color: #3182ce;
}

.sell-btn {
  background-color: #ed8936;
  color: white;
}

.sell-btn:hover:not(:disabled) {
  background-color: #dd6b20;
}

.action-btn:disabled {
  background-color: #cbd5e0;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .product-details {
    flex-direction: column;
  }

  .product-image-container {
    width: 100%;
    height: 150px;
    margin-right: 0;
    margin-bottom: 15px;
  }

  .price-info {
    flex-direction: column;
  }

  .price-trend {
    text-align: left;
    margin-top: 10px;
  }

  .trend-indicator {
    justify-content: flex-start;
  }
}
</style>
