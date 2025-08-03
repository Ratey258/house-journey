<!--
  Enhanced Market 组件示例
  展示如何使用Service Composables而不是直接访问Store
  
  架构改进：
  1. 使用 useMarketService 替代直接访问 Store
  2. 使用 usePlayerService 获取玩家数据
  3. 使用 useEventEmitter 监听业务事件
  4. 完整的错误处理和加载状态
  5. 类型安全的数据操作
-->
<template>
  <div class="enhanced-market">
    <!-- 头部 -->
    <div class="market-header">
      <h2 class="market-title">市场交易</h2>
      <div class="market-status">
        <span class="status-indicator" :class="marketStatusClass"></span>
        <span class="status-text">{{ marketStatusText }}</span>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="marketError || playerError" class="error-banner">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">{{ marketError || playerError }}</span>
        <button @click="clearAllErrors" class="error-dismiss">✕</button>
      </div>
    </div>

    <!-- 成功信息 -->
    <div v-if="successMessage" class="success-banner">
      <div class="success-content">
        <span class="success-icon">✅</span>
        <span class="success-message">{{ successMessage }}</span>
        <button @click="clearSuccessMessage" class="success-dismiss">✕</button>
      </div>
    </div>

    <!-- 玩家资金信息 -->
    <div v-if="player" class="player-funds">
      <div class="funds-info">
        <span class="funds-label">可用资金:</span>
        <span class="funds-amount">¥{{ formatNumber(playerMoney) }}</span>
      </div>
      <div class="inventory-info">
        <span class="inventory-label">背包:</span>
        <span class="inventory-count">{{ playerInventory.length }} 种商品</span>
      </div>
    </div>

    <!-- 市场操作区域 -->
    <div class="market-actions">
      <div class="action-group">
        <button 
          @click="refreshMarketData" 
          :disabled="isMarketLoading"
          class="btn refresh-btn"
        >
          <span class="btn-icon">🔄</span>
          <span class="btn-text">刷新市场</span>
        </button>
        
        <button 
          @click="updatePrices" 
          :disabled="isMarketLoading"
          class="btn update-btn"
        >
          <span class="btn-icon">📈</span>
          <span class="btn-text">更新价格</span>
        </button>
      </div>
    </div>

    <!-- 产品列表 -->
    <div class="products-section">
      <h3>可交易商品</h3>
      
      <!-- 加载状态 -->
      <div v-if="isMarketLoading" class="loading-section">
        <div class="loading-spinner"></div>
        <p>正在加载市场数据...</p>
      </div>

      <!-- 商品列表 -->
      <div v-else class="products-grid">
        <!-- 示例商品卡片 -->
        <div 
          v-for="product in sampleProducts" 
          :key="product.id" 
          class="product-card"
        >
          <div class="product-header">
            <h4 class="product-name">{{ product.name }}</h4>
            <div class="product-category">{{ product.category }}</div>
          </div>
          
          <div class="product-price">
            <span class="price-label">当前价格:</span>
            <span class="price-value">¥{{ formatNumber(product.price) }}</span>
          </div>
          
          <div class="product-trend">
            <span class="trend-label">趋势:</span>
            <span 
              class="trend-value" 
              :class="getTrendClass(product.trend)"
            >
              {{ getTrendText(product.trend) }}
            </span>
          </div>
          
          <div class="product-actions">
            <button 
              @click="buyProduct(product.id)" 
              :disabled="!canBuyProduct(product) || isMarketLoading"
              class="btn buy-btn"
            >
              购买
            </button>
            
            <button 
              @click="sellProduct(product.id)" 
              :disabled="!canSellProduct(product) || isMarketLoading"
              class="btn sell-btn"
            >
              出售
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMarketService } from '../../composables/useMarketService';
import { usePlayerService } from '../../composables/usePlayerService';
import { useEventEmitter } from '../../composables/useEventEmitter';
import { formatNumber } from '../../../infrastructure/utils/formatUtils';

// 类型定义
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  trend: 'rising' | 'falling' | 'stable';
}

// 使用Service Composables
const {
  buyProduct: buyProductService,
  sellProduct: sellProductService,
  updateMarketPrices,
  getMarketStatus,
  isLoading: isMarketLoading,
  error: marketError,
  clearError: clearMarketError
} = useMarketService();

const {
  player,
  isLoading: isPlayerLoading,
  error: playerError,
  playerMoney,
  playerInventory,
  loadPlayer,
  clearError: clearPlayerError
} = usePlayerService();

const {
  on: addEventListener,
  off: removeEventListener,
  emitProductPurchased,
  emitProductSold
} = useEventEmitter();

// 本地状态
const successMessage = ref<string | null>(null);
const currentWeek = ref(1);

// 示例商品数据（在实际应用中，这应该从服务层获取）
const sampleProducts = ref<Product[]>([
  { id: '1', name: '电子设备', price: 1500, category: '电子', trend: 'rising' },
  { id: '2', name: '服装配饰', price: 300, category: '服装', trend: 'stable' },
  { id: '3', name: '家居用品', price: 800, category: '家居', trend: 'falling' },
  { id: '4', name: '食品饮料', price: 50, category: '食品', trend: 'rising' }
]);

// 计算属性
const marketStatusClass = computed(() => ({
  'status-active': !isMarketLoading.value && !marketError.value,
  'status-loading': isMarketLoading.value,
  'status-error': !!marketError.value
}));

const marketStatusText = computed(() => {
  if (marketError.value) return '市场异常';
  if (isMarketLoading.value) return '数据加载中';
  return '市场正常';
});

// 方法
const buyProduct = async (productId: string): Promise<void> => {
  try {
    const result = await buyProductService(productId, 1);
    if (result.success) {
      successMessage.value = '购买成功！';
      await loadPlayer(); // 刷新玩家数据
      
      // 发送事件通知
      const product = sampleProducts.value.find(p => p.id === productId);
      if (product) {
        emitProductPurchased({
          productId,
          productName: product.name,
          quantity: 1,
          price: product.price
        });
      }
    }
  } catch (error) {
    console.error('购买失败:', error);
  }
};

const sellProduct = async (productId: string): Promise<void> => {
  try {
    const result = await sellProductService(productId, 1);
    if (result.success) {
      successMessage.value = '出售成功！';
      await loadPlayer(); // 刷新玩家数据
      
      // 发送事件通知
      const product = sampleProducts.value.find(p => p.id === productId);
      if (product) {
        emitProductSold({
          productId,
          productName: product.name,
          quantity: 1,
          price: product.price
        });
      }
    }
  } catch (error) {
    console.error('出售失败:', error);
  }
};

const updatePrices = async (): Promise<void> => {
  try {
    await updateMarketPrices(currentWeek.value);
    successMessage.value = '价格更新成功！';
  } catch (error) {
    console.error('价格更新失败:', error);
  }
};

const refreshMarketData = async (): Promise<void> => {
  try {
    await getMarketStatus();
    await loadPlayer();
    successMessage.value = '市场数据刷新成功！';
  } catch (error) {
    console.error('刷新市场数据失败:', error);
  }
};

const canBuyProduct = (product: Product): boolean => {
  if (!player.value) return false;
  return playerMoney.value >= product.price;
};

const canSellProduct = (product: Product): boolean => {
  if (!playerInventory.value) return false;
  return playerInventory.value.some(item => item.productId === product.id);
};

const getTrendClass = (trend: string): string => {
  return `trend-${trend}`;
};

const getTrendText = (trend: string): string => {
  const trendMap: Record<string, string> = {
    'rising': '↗ 上涨',
    'falling': '↘ 下跌',
    'stable': '→ 稳定'
  };
  return trendMap[trend] || '未知';
};

const clearAllErrors = (): void => {
  clearMarketError();
  clearPlayerError();
};

const clearSuccessMessage = (): void => {
  successMessage.value = null;
};

// 事件监听器
const handleProductPurchased = (data: any): void => {
  console.log('产品购买事件:', data);
};

const handleProductSold = (data: any): void => {
  console.log('产品出售事件:', data);
};

// 生命周期
onMounted(async () => {
  // 加载初始数据
  await loadPlayer();
  
  // 注册事件监听器
  addEventListener('PRODUCT_PURCHASED', handleProductPurchased);
  addEventListener('PRODUCT_SOLD', handleProductSold);
});

onUnmounted(() => {
  // 清理事件监听器
  removeEventListener('PRODUCT_PURCHASED', handleProductPurchased);
  removeEventListener('PRODUCT_SOLD', handleProductSold);
});
</script>

<style scoped>
.enhanced-market {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.market-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e1e8ed;
}

.market-title {
  margin: 0;
  font-size: 28px;
  color: #2c3e50;
}

.market-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.status-active {
  background-color: #27ae60;
}

.status-loading {
  background-color: #f39c12;
  animation: pulse 1.5s infinite;
}

.status-error {
  background-color: #e74c3c;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.error-banner, .success-banner {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.error-banner {
  background-color: #ffeaea;
  border: 1px solid #f5c6cb;
}

.success-banner {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

.error-content, .success-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
}

.error-message, .success-message {
  flex: 1;
  color: #721c24;
}

.success-message {
  color: #155724;
}

.error-dismiss, .success-dismiss {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.error-dismiss:hover, .success-dismiss:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.player-funds {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.funds-info, .inventory-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.funds-amount, .inventory-count {
  font-size: 18px;
  font-weight: bold;
}

.market-actions {
  margin-bottom: 24px;
}

.action-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.products-section h3 {
  margin: 0 0 16px;
  font-size: 20px;
  color: #2c3e50;
}

.loading-section {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-header {
  margin-bottom: 16px;
}

.product-name {
  margin: 0 0 8px;
  font-size: 18px;
  color: #2c3e50;
}

.product-category {
  color: #7f8c8d;
  font-size: 14px;
}

.product-price, .product-trend {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.price-value {
  font-weight: bold;
  font-size: 16px;
  color: #27ae60;
}

.trend-rising {
  color: #27ae60;
}

.trend-falling {
  color: #e74c3c;
}

.trend-stable {
  color: #95a5a6;
}

.product-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.btn {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.refresh-btn {
  background: #3498db;
}

.update-btn {
  background: #9b59b6;
}

.buy-btn {
  background: #27ae60;
}

.sell-btn {
  background: #e67e22;
}

.btn-icon {
  font-size: 12px;
}

.btn-text {
  font-size: 14px;
}
</style>