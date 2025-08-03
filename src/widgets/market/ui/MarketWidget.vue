<!--
  市场Widget
  商品交易界面
-->
<template>
  <div class="market-widget">
    <!-- 市场头部 -->
    <div class="market-header">
      <div class="location-selector">
        <label>当前位置：</label>
        <select 
          :value="state.currentLocation" 
          @change="changeLocation(($event.target as HTMLSelectElement).value)"
          class="location-select"
        >
          <option 
            v-for="location in state.availableLocations"
            :key="location.id"
            :value="location.id"
          >
            {{ location.name }}
          </option>
        </select>
      </div>

      <div class="market-actions">
        <button @click="refreshPrices" class="refresh-btn" title="刷新价格">
          🔄
        </button>
      </div>
    </div>

    <!-- 当前位置信息 -->
    <div v-if="currentLocationData" class="location-info">
      <h3>{{ currentLocationData.name }}</h3>
      <p>{{ currentLocationData.description }}</p>
    </div>

    <!-- 产品列表 -->
    <div class="products-section">
      <h4>可用商品</h4>
      
      <div v-if="availableProducts.length === 0" class="no-products">
        <p>当前位置没有可用商品</p>
      </div>

      <div v-else class="products-grid">
        <div
          v-for="marketProduct in availableProducts"
          :key="marketProduct.product.id"
          :class="['product-card', { 
            selected: state.selectedProduct?.product.id === marketProduct.product.id,
            unavailable: !marketProduct.available 
          }]"
          @click="selectProduct(marketProduct)"
        >
          <div class="product-icon">{{ marketProduct.product.icon || '📦' }}</div>
          
          <div class="product-info">
            <h5>{{ marketProduct.product.name }}</h5>
            <p class="product-description">{{ marketProduct.product.description }}</p>
            
            <div class="price-info">
              <span class="current-price">¥{{ marketProduct.currentPrice }}</span>
              <span 
                v-if="marketProduct.priceChange !== 0"
                :class="['price-change', marketProduct.trend]"
              >
                {{ marketProduct.priceChange > 0 ? '+' : '' }}{{ marketProduct.priceChange }}
                ({{ marketProduct.priceChangePercent.toFixed(1) }}%)
              </span>
            </div>
            
            <div class="product-meta">
              <span class="size">大小: {{ marketProduct.product.size }}</span>
              <span class="category">{{ marketProduct.product.category }}</span>
            </div>
          </div>

          <div class="trend-indicator">
            <span v-if="marketProduct.trend === 'up'" class="trend-up">📈</span>
            <span v-else-if="marketProduct.trend === 'down'" class="trend-down">📉</span>
            <span v-else class="trend-stable">➡️</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 交易面板 -->
    <div v-if="state.selectedProduct" class="trading-panel">
      <h4>交易 - {{ state.selectedProduct.product.name }}</h4>
      
      <div class="trade-controls">
        <div class="quantity-control">
          <label>数量：</label>
          <input 
            type="number" 
            :value="state.tradeAmount" 
            @input="setTradeAmount(Number(($event.target as HTMLInputElement).value))"
            min="1"
            class="quantity-input"
          />
        </div>

        <div class="total-cost">
          <span>总价：¥{{ (state.selectedProduct.currentPrice * state.tradeAmount).toLocaleString() }}</span>
        </div>
      </div>

      <div class="trade-buttons">
        <button 
          @click="buyProduct"
          :disabled="!canTrade"
          :class="['trade-btn', 'buy-btn', { loading: state.isTrading }]"
        >
          {{ state.isTrading ? '购买中...' : '购买' }}
        </button>

        <button 
          @click="sellProduct"
          :disabled="!canTrade"
          :class="['trade-btn', 'sell-btn', { loading: state.isTrading }]"
        >
          {{ state.isTrading ? '出售中...' : '出售' }}
        </button>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="state.error" class="error-message">
      <span class="error-icon">⚠️</span>
      <span>{{ state.error }}</span>
      <button @click="state.error = null" class="close-error">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMarket } from '../model/useMarket';

// 使用市场功能
const {
  state,
  currentLocationData,
  availableProducts,
  canTrade,
  changeLocation,
  selectProduct,
  setTradeAmount,
  buyProduct,
  sellProduct,
  refreshPrices
} = useMarket();
</script>

<style scoped>
.market-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.market-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
}

.location-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.location-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.refresh-btn {
  padding: 0.5rem;
  border: none;
  background: var(--color-primary);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.refresh-btn:hover {
  background: var(--color-primary-dark);
}

.location-info {
  padding: 1rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
}

.location-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-primary);
}

.location-info p {
  margin: 0;
  color: var(--color-text-secondary);
}

.products-section h4 {
  margin: 0 0 1rem 0;
  color: var(--color-text-primary);
}

.no-products {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.product-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-card:hover {
  background: var(--color-bg-hover);
}

.product-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.product-card.unavailable {
  opacity: 0.6;
  cursor: not-allowed;
}

.product-icon {
  font-size: 2rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  border-radius: 50%;
}

.product-info {
  flex: 1;
}

.product-info h5 {
  margin: 0 0 0.25rem 0;
  color: var(--color-text-primary);
}

.product-description {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.price-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.current-price {
  font-weight: bold;
  color: var(--color-text-primary);
}

.price-change.up {
  color: var(--color-success);
}

.price-change.down {
  color: var(--color-error);
}

.price-change.stable {
  color: var(--color-text-secondary);
}

.product-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.trend-indicator {
  font-size: 1.5rem;
}

.trading-panel {
  padding: 1rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  border: 2px solid var(--color-primary);
}

.trading-panel h4 {
  margin: 0 0 1rem 0;
  color: var(--color-text-primary);
}

.trade-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.total-cost {
  font-weight: bold;
  color: var(--color-text-primary);
}

.trade-buttons {
  display: flex;
  gap: 1rem;
}

.trade-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.buy-btn {
  background: var(--color-success);
  color: white;
}

.buy-btn:hover:not(:disabled) {
  background: var(--color-success-dark);
}

.sell-btn {
  background: var(--color-warning);
  color: white;
}

.sell-btn:hover:not(:disabled) {
  background: var(--color-warning-dark);
}

.trade-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.trade-btn.loading {
  opacity: 0.8;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--color-error-light);
  color: var(--color-error-dark);
  border-radius: 6px;
  border: 1px solid var(--color-error);
}

.close-error {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--color-error-dark);
  cursor: pointer;
  font-size: 1.2rem;
}
</style>