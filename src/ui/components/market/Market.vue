<template>
  <div class="market">
    <h2 class="title">
      {{ $t('market.title', { location: currentLocation.name }) }}
    </h2>

    <div class="market-header">
      <div class="header-row">
        <!-- 将地点选择改为按钮组 -->
        <div class="location-buttons">
          <button
            v-for="location in locations"
            :key="location.id"
            class="location-btn"
            :class="{ active: location.id === currentLocation.id }"
            @click="changeLocation(location.id)"
          >
            {{ location.name }}
          </button>
        </div>

        <!-- 视图切换按钮移到右上角 -->
        <div class="view-toggle">
          <button
            :class="['view-btn', { active: viewMode === 'table' }]"
            @click="viewMode = 'table'"
          >
            <i class="icon-table" /> 表格视图
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'card' }]"
            @click="viewMode = 'card'"
          >
            <i class="icon-card" /> 卡片视图
          </button>
        </div>
      </div>
    </div>

    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'" class="products-container">
      <table class="products-table">
        <thead>
          <tr>
            <th>{{ $t('market.productName') }}</th>
            <th>{{ $t('market.price') }}</th>
            <th>{{ $t('market.trend') }}</th>
            <th>{{ $t('market.change') }}</th>
            <th>拥有数量</th>
            <th>{{ $t('market.action') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in availableProducts" :key="product.id" :class="{'special-product': product.isSpecial}">
            <td>
              <div class="product-name">
                {{ product.name }}
                <span v-if="product.isSpecial" class="special-badge" title="特色商品，价格更优惠">✦</span>
              </div>
            </td>
            <td class="price">
              ¥{{ formatNumber(product.currentPrice) }}
            </td>
            <td class="trend-column">
              <div class="trend-container">
                <PriceTrendComponent
                  :trend="product.trend"
                  :percent="product.changePercent"
                />
              </div>
            </td>
            <td class="price-change" :class="getPriceChangeClass(product.changePercent)">
              {{ formatChange(product.changePercent) }}
            </td>
            <td class="owned-quantity">
              {{ getPlayerProductQuantity(product.id) || 0 }}
            </td>
            <td>
              <div class="action-buttons">
                <!-- 购买按钮组 -->
                <div class="button-group">
                  <button
                    class="buy-btn"
                    :disabled="!canPlayerBuy(product)"
                    @click="openTradePanel(product)"
                  >
                    购买
                  </button>
                  <button
                    class="quick-buy-btn"
                    :disabled="!canPlayerBuy(product)"
                    title="快速买入1个"
                    @click="quickBuy(product)"
                  >
                    +1
                  </button>
                  <button
                    class="quick-buy-btn-10"
                    :disabled="!canPlayerBuy(product)"
                    title="快速买入10个"
                    @click="quickBuyMultiple(product, 10)"
                  >
                    +10
                  </button>
                </div>

                <!-- 出售按钮组 -->
                <div v-if="canPlayerSell(product)" class="button-group">
                  <button
                    class="sell-btn"
                    title="出售该物品"
                    @click="openSellPanel(product)"
                  >
                    出售
                  </button>
                  <button
                    class="quick-sell-btn"
                    title="快速卖出1个"
                    @click="quickSell(product)"
                  >
                    -1
                  </button>
                  <button
                    class="quick-sell-btn-10"
                    title="快速卖出10个"
                    @click="quickSellMultiple(product, 10)"
                  >
                    -10
                  </button>
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="availableProducts.length === 0">
            <td colspan="6" class="no-products">
              {{ $t('market.noProducts') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 卡片视图 -->
    <div v-else class="products-grid">
      <div
        v-for="product in availableProducts"
        :key="product.id"
        class="product-card"
        :class="{'special-product': product.isSpecial}"
      >
        <div class="product-card-header">
          <h3 class="product-name">
            {{ product.name }}
            <span v-if="product.isSpecial" class="special-badge" title="特色商品，价格更优惠">✦</span>
          </h3>
        </div>

        <div class="product-card-body">
          <div class="price-section">
            <div class="current-price">
              ¥{{ formatNumber(product.currentPrice) }}
            </div>
                          <div class="trend-price-change">
              <PriceTrendComponent
                :trend="product.trend"
                :percent="product.changePercent"
              />
              <span class="card-price-change" :class="getPriceChangeClass(product.changePercent)">
                {{ formatChange(product.changePercent) }}
              </span>
            </div>
            <div class="owned-quantity-card">
              拥有: <span>{{ getPlayerProductQuantity(product.id) || 0 }}</span>
            </div>
          </div>

          <MiniPriceChart
            v-if="getPriceHistory(product.id).length > 1"
            :history="getPriceHistory(product.id)"
            :height="40"
          />

          <div class="product-actions">
            <!-- 购买和出售按钮在同一行 -->
            <div class="action-row">
              <div class="button-group">
                <button
                  class="buy-btn"
                  :disabled="!canPlayerBuy(product)"
                  @click="openTradePanel(product)"
                >
                  购买
                </button>
                <button
                  class="quick-buy-btn"
                  :disabled="!canPlayerBuy(product)"
                  title="快速买入1个"
                  @click="quickBuy(product)"
                >
                  +1
                </button>
                <button
                  class="quick-buy-btn-10"
                  :disabled="!canPlayerBuy(product)"
                  title="快速买入10个"
                  @click="quickBuyMultiple(product, 10)"
                >
                  +10
                </button>
              </div>

              <div v-if="canPlayerSell(product)" class="button-group">
                <button
                  class="sell-btn"
                  title="出售该物品"
                  @click="openSellPanel(product)"
                >
                  出售
                </button>
                <button
                  class="quick-sell-btn"
                  title="快速卖出1个"
                  @click="quickSell(product)"
                >
                  -1
                </button>
                <button
                  class="quick-sell-btn-10"
                  title="快速卖出10个"
                  @click="quickSellMultiple(product, 10)"
                >
                  -10
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="availableProducts.length === 0" class="no-products-card">
        {{ $t('market.noProducts') }}
      </div>
    </div>

    <!-- 增强交易面板 -->
    <transition name="modal" appear>
      <div v-if="showTradePanel" class="modal-backdrop" @click.self="closeTradePanel">
        <div class="modal-container">
          <EnhancedTradePanel
            :selected-product="selectedProduct"
            @close="closeTradePanel"
          />
        </div>
      </div>
    </transition>

    <!-- 交易成功提示 -->
    <transition name="fade">
      <div v-if="showTransactionToast" class="transaction-toast" :class="transactionToastClass">
        <div class="toast-content">
          <span class="toast-icon">{{ transactionToastIcon }}</span>
          <span class="toast-message">{{ transactionToastMessage }}</span>
        </div>
        <div class="toast-progress-bar" />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useGameStore } from '../../../stores';
import { useGameCoreStore } from '../../../stores/gameCore';
import { useI18n } from 'vue-i18n';
import { PriceTrend } from '../../../core/services/priceSystem';
import EnhancedTradePanel from './EnhancedTradePanel.vue';
import PriceTrendComponent from './PriceTrend.vue';
import MiniPriceChart from './MiniPriceChart.vue';
import { formatNumber, formatPercentChange, getPriceChangeClass } from '../../../infrastructure/utils/formatUtils';

// ✅ 使用 Service Composables 替代直接业务操作
import { useMarketService, usePlayerService } from '@/ui/composables';

const { t } = useI18n();
const gameStore = useGameStore(); // 暂时保留用于数据读取
const gameCoreStore = useGameCoreStore(); // 游戏核心存储

// ✅ Service Composables - 用于业务操作
const { 
  buyProduct: buyProductService, 
  sellProduct: sellProductService, 
  isLoading: isMarketLoading, 
  error: marketError 
} = useMarketService();

const { 
  player: playerFromService, 
  playerMoney, 
  playerInventory: playerInventoryFromService, 
  loadPlayer 
} = usePlayerService();

// 计算属性 - 混合使用Store数据（读取）和Service数据（写入）
const locations = computed(() => gameStore.locations || []);
const currentLocation = computed(() => gameStore.currentLocation || { id: '', name: '加载中...' });
const availableProducts = computed(() => gameStore.availableProducts || []);
const player = computed(() => gameStore.player || { money: 0, capacity: 0, inventoryUsed: 0, inventory: [] });

// 响应式变量
const showTradePanel = ref(false);
const selectedProduct = ref(null);
const showTransactionToast = ref(false);
const transactionToastMessage = ref('');
const transactionToastClass = ref('');
const transactionToastIcon = ref('');
const viewMode = ref('table'); // 默认使用表格视图

// 市场状态相关计算属性已移除

// 格式化价格变化
const formatChange = (changePercent) => {
  if (changePercent === undefined || changePercent === null || changePercent === 0) return '0.0%';
  const prefix = changePercent > 0 ? '+' : '';
  return `${prefix}${changePercent.toFixed(1)}%`;
};

// 修改changeLocation函数，添加进入下一周的逻辑
const changeLocation = (locationId) => {
  if (locationId && locationId !== currentLocation.value?.id) {
    // 先进入下一周
    gameCoreStore.advanceWeek();

    // 然后切换地点
    gameStore.changeLocation(locationId);

    // 显示提示消息
    const newLocation = locations.value.find(loc => loc.id === locationId);
    if (newLocation) {
      transactionToastMessage.value = `已前往${newLocation.name}，进入下一周`;
      transactionToastClass.value = 'location-change';
      transactionToastIcon.value = '🚶';
      showTransactionToast.value = true;

      // 3秒后自动隐藏提示
      setTimeout(() => {
        showTransactionToast.value = false;
      }, 3000);
    }
  }
};

// 判断玩家是否可以购买商品
const canPlayerBuy = (product) => {
  if (!product) return false;

  // 检查玩家资金是否足够
  if (product.currentPrice > player.value.money) return false;

  // 检查玩家背包容量是否足够
  if (player.value.inventoryUsed >= player.value.capacity) return false;

  return true;
};

// 判断玩家是否可以出售商品
const canPlayerSell = (product) => {
  if (!product) return false;

  // 直接从playerStore获取最新的inventory数据
  const playerInventory = gameStore.player.inventory || [];
  const hasProduct = playerInventory.some(item => {
    // 多种匹配方式，确保兼容性
    const match = (item.productId === product.id || 
                  String(item.productId) === String(product.id) ||
                  (typeof product.id === 'number' && Number(item.productId) === product.id)) &&
                  item.quantity > 0;
    return match;
  });
  
  console.log('Market - 是否可以出售:', { productId: product.id, hasProduct, inventory: playerInventory });
  return hasProduct;
};

// 获取玩家拥有的指定商品数量
const getPlayerProductQuantity = (productId) => {
  // 直接从playerStore获取最新的inventory数据
  const playerInventory = gameStore.player.inventory || [];
  console.log('Market - 获取商品数量:', { productId, inventory: playerInventory });
  
  const quantity = playerInventory
    .filter(item => {
      // 多种匹配方式，确保兼容性
      const match = item.productId === productId || 
                   String(item.productId) === String(productId) ||
                   (typeof productId === 'number' && Number(item.productId) === productId);
      if (match) {
        console.log('Market - 找到匹配商品:', { itemProductId: item.productId, productId, quantity: item.quantity });
      }
      return match;
    })
    .reduce((total, item) => total + item.quantity, 0);
    
  console.log('Market - 商品总数量:', { productId, quantity });
  return quantity;
};

// 打开交易面板
const openTradePanel = (product) => {
  selectedProduct.value = product;
  showTradePanel.value = true;
};

// 打开出售面板
const openSellPanel = (product) => {
  selectedProduct.value = product;
  showTradePanel.value = true;
  // 通知EnhancedTradePanel组件切换到出售模式
  setTimeout(() => {
    document.querySelector('.enhanced-trade-panel .type-btn:nth-child(2)').click();
  }, 100);
};

// 关闭交易面板
const closeTradePanel = () => {
  showTradePanel.value = false;
  selectedProduct.value = null;
};

const getPriceHistory = (productId) => {
  return gameStore.productPrices?.[productId]?.history || [];
};

// 快速购买1个 - ✅ 使用Service Composables
const quickBuy = async (product) => {
  if (!canPlayerBuy(product)) return;

  try {
    // ✅ 使用Service层的购买方法
    const result = await buyProductService(product.id, 1);

    if (result.success) {
      // 显示成功提示，带有产品图标和名称
      transactionToastMessage.value = `已购买 1 个 ${product.name}`;
      transactionToastClass.value = 'purchase-success';
      transactionToastIcon.value = '✓';

      // 重置之前的提示（如果存在）
      showTransactionToast.value = false;

      // 延迟一帧后显示，确保动画正确播放
      requestAnimationFrame(() => {
        showTransactionToast.value = true;

        // 弹窗将通过CSS动画自动淡出
        // 但我们仍需在动画结束后隐藏元素
        setTimeout(() => {
          showTransactionToast.value = false;
        }, 3000);
      });

      // ✅ 强制刷新页面数据（购买成功后）
      console.log('购买成功，强制刷新UI数据');
      await loadPlayer(); // 刷新玩家数据
      nextTick(() => {
        // 这里可以触发其他需要更新的组件
      });
    } else {
      // 显示失败提示
      transactionToastMessage.value = result.message || '购买失败';
      transactionToastClass.value = 'purchase-failed';
      transactionToastIcon.value = '✗';

      // 重置之前的提示（如果存在）
      showTransactionToast.value = false;

      requestAnimationFrame(() => {
        showTransactionToast.value = true;

        setTimeout(() => {
          showTransactionToast.value = false;
        }, 3000);
      });
    }
  } catch (error) {
    console.error('快速购买出错:', error);
  }
};

// 快速购买多个 - ✅ 使用Service Composables
const quickBuyMultiple = async (product, quantity) => {
  if (!canPlayerBuy(product)) return;

  try {
    // ✅ 使用Service层的购买方法
    const result = await buyProductService(product.id, quantity);

    if (result.success) {
      // 显示成功提示
      transactionToastMessage.value = `已购买 ${quantity} 个 ${product.name}`;
      transactionToastClass.value = 'purchase-success';
      transactionToastIcon.value = '✓';

      // 重置之前的提示（如果存在）
      showTransactionToast.value = false;

      // 延迟一帧后显示，确保动画正确播放
      requestAnimationFrame(() => {
        showTransactionToast.value = true;

        // 弹窗将通过CSS动画自动淡出
        setTimeout(() => {
          showTransactionToast.value = false;
        }, 3000);
      });

      // ✅ 强制刷新页面数据（购买成功后）
      console.log('批量购买成功，强制刷新UI数据');
      await loadPlayer(); // 刷新玩家数据
      nextTick(() => {
        // 这里可以触发其他需要更新的组件
      });
    } else {
      // 显示失败提示
      transactionToastMessage.value = result.message || '购买失败';
      transactionToastClass.value = 'purchase-failed';
      transactionToastIcon.value = '✗';

      // 重置之前的提示（如果存在）
      showTransactionToast.value = false;

      requestAnimationFrame(() => {
        showTransactionToast.value = true;

        setTimeout(() => {
          showTransactionToast.value = false;
        }, 3000);
      });
    }
  } catch (error) {
    console.error('快速购买多个出错:', error);
  }
};

// 快速出售1个 - ✅ 使用Service Composables
const quickSell = async (product) => {
  if (!canPlayerSell(product)) return;

  try {
    // ✅ 使用Service层的出售方法
    const result = await sellProductService(product.id, 1);

    if (result.success) {
      // 显示成功提示，包含收入金额和利润信息
      let message = `已出售 1 个 ${product.name}`;

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

        // 弹窗将通过CSS动画自动淡出
        setTimeout(() => {
          showTransactionToast.value = false;
        }, 3000);
      });

      // ✅ 刷新玩家数据
      await loadPlayer();
    } else {
      // 显示失败提示
      transactionToastMessage.value = result.message || '出售失败';
      transactionToastClass.value = 'purchase-failed'; // 使用相同的失败样式
      transactionToastIcon.value = '✗';

      // 重置之前的提示（如果存在）
      showTransactionToast.value = false;

      requestAnimationFrame(() => {
        showTransactionToast.value = true;

        setTimeout(() => {
          showTransactionToast.value = false;
        }, 3000);
      });
    }
  } catch (error) {
    console.error('快速出售出错:', error);
  }
};

// 快速出售多个 - ✅ 使用Service Composables
const quickSellMultiple = async (product, quantity) => {
  if (!canPlayerSell(product)) return;

  try {
    // ✅ 使用Service层的出售方法
    const result = await sellProductService(product.id, quantity);

    if (result.success) {
      // 显示成功提示，包含收入金额和利润信息
      let message = `已出售 ${quantity} 个 ${product.name}`;

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

        // 弹窗将通过CSS动画自动淡出
        setTimeout(() => {
          showTransactionToast.value = false;
        }, 3000);
      });

      // ✅ 刷新玩家数据
      await loadPlayer();
    } else {
      // 显示失败提示
      transactionToastMessage.value = result.message || '出售失败';
      transactionToastClass.value = 'purchase-failed'; // 使用相同的失败样式
      transactionToastIcon.value = '✗';

      // 重置之前的提示（如果存在）
      showTransactionToast.value = false;

      requestAnimationFrame(() => {
        showTransactionToast.value = true;

        setTimeout(() => {
          showTransactionToast.value = false;
        }, 3000);
      });
    }
  } catch (error) {
    console.error('快速出售多个出错:', error);
  }
};
</script>

<style scoped>
.market {
  padding: 1rem;
}

.title {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.market-header {
  margin-bottom: 1.5rem;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 地点按钮组样式 */
.location-buttons {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0; /* 移除间隙，使用margin来控制 */
  padding: 0.5rem 1rem; /* 增加内边距 */
  background-color: #f0f8ff;
  border-radius: 8px;
  border: 1px solid #d0e3ff;
  flex: 1; /* 占据剩余空间 */
  margin-right: 20px; /* 增加与视图切换按钮的距离 */
  align-items: center;
  justify-content: space-around; /* 均匀分布按钮 */
  min-height: 50px; /* 设置最小高度 */
}

.location-btn {
  padding: 0.5rem 0.8rem;
  border: none;
  border-radius: 6px;
  background-color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  margin: 3px; /* 增加外边距 */
  position: relative; /* 为分隔线定位 */
  font-size: 0.9rem;
  letter-spacing: 0.3px; /* 增加字母间距 */
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.location-btn:hover {
  background-color: #3498db;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.location-btn.active {
  background-color: #2980b9;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1; /* 确保活动按钮在上层 */
  font-weight: 600; /* 加粗 */
}

/* 优化按钮组布局 */

/* 市场状态相关样式已移除 */

.view-toggle {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end; /* 右对齐 */
  z-index: 10; /* 确保在其他元素上方 */
}

.view-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.view-btn:hover {
  background-color: #f8f9fa;
  border-color: #c0c0c0;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
}

.view-btn.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
}

/* 表格视图样式 */
.products-container {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-top: 1rem;
  padding: 0.5rem;
}

.products-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 0;
  table-layout: fixed; /* 固定表格布局 */
}

.products-table th,
.products-table td {
  padding: 0.6rem 0.5rem;
  text-align: left;
  box-sizing: border-box;
  transition: all 0.2s ease;
  vertical-align: middle;
}

.products-table th {
  background: linear-gradient(to bottom, #f8f9fa, #f0f0f0);
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.95rem;
  border-bottom: 2px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
}

.products-table tr {
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.products-table tr:hover {
  background-color: #f9f9f9;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.products-table td {
  border-bottom: 1px solid #f0f0f0;
  height: 56px; /* 减小行高 */
}

/* 设置操作列的宽度 */
.products-table th:nth-child(1) {
  width: 12%; /* 商品名称 */
}

.products-table th:nth-child(2) {
  width: 12%; /* 价格 */
  text-align: center;
}

.products-table th:nth-child(3) {
  width: 12%; /* 趋势 */
  text-align: center;
}

.products-table th:nth-child(4) {
  width: 12%; /* 涨跌 */
  text-align: center;
}

.products-table th:nth-child(5) {
  width: 10%; /* 拥有数量 */
  text-align: center;
}

.products-table th:last-child {
  width: 38%; /* 操作按钮 */
}

.products-table td:nth-child(2) {
  text-align: center; /* 价格居中 */
}

.products-table td:nth-child(3) {
  text-align: center; /* 趋势居中 */
}

.products-table td:nth-child(4) {
  text-align: center; /* 涨跌居中 */
}

.products-table td:last-child {
  padding-left: 0.3rem;
  padding-right: 0.3rem;
}

/* 拥有数量列样式 */
.owned-quantity {
  font-weight: 600;
  text-align: center;
  color: #3498db;
  width: 80px;
}

/* 卡片视图中的拥有数量样式 */
.owned-quantity-card {
  margin-top: 5px;
  font-size: 0.85rem;
  color: #555;
  text-align: center;
}

.owned-quantity-card span {
  font-weight: 600;
  color: #3498db;
}

.special-product {
  background-color: rgba(255, 248, 225, 0.5);
  position: relative;
}

.special-product:hover {
  background-color: rgba(255, 248, 225, 0.8);
}

.special-badge {
  color: #fff;
  background-color: #ffc107;
  margin-left: 0.5rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  vertical-align: middle;
}

.price {
  font-weight: 700;
  font-size: 1.1rem;
  color: #2c3e50;
  background: -webkit-linear-gradient(45deg, #2c3e50, #4a6fa5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.trend-column {
  width: 70px;
  text-align: center;
}

.trend-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  border-radius: 8px;
  background-color: rgba(0,0,0,0.02);
}

.price-change {
  width: 90px;
  text-align: center;
  font-weight: 600;
  font-family: var(--font-family-numbers, 'Arial', sans-serif);
  font-size: 0.95rem;
  padding: 4px 8px;
  border-radius: 20px;
  display: inline-block;
}

.price-up {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.price-down {
  background-color: rgba(46, 204, 113, 0.1);
  color: #27ae60;
}

.price-stable {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 0.8rem;
  min-height: 36px; /* 增加高度 */
  justify-content: flex-start; /* 左对齐 */
}

.button-group {
  display: flex;
  border-radius: 6px; /* 增加圆角 */
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08); /* 添加阴影 */
  transition: all 0.2s ease;
}

.button-group:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.12);
}

.buy-btn {
  padding: 0.35rem 0.85rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px 0 0 6px;
  cursor: pointer;
  min-width: 60px;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
}

.buy-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.buy-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.quick-buy-btn {
  padding: 0.35rem 0.5rem;
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 0;
  cursor: pointer;
  min-width: 40px;
  font-size: 0.9rem;
  font-weight: 500;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.quick-buy-btn:hover:not(:disabled) {
  background-color: #27ae60;
}

.quick-buy-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.quick-buy-btn-10 {
  padding: 0.35rem 0.5rem;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  min-width: 40px;
  font-size: 0.9rem;
  font-weight: 500;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.quick-buy-btn-10:hover:not(:disabled) {
  background-color: #219653;
}

.quick-buy-btn-10:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
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

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.no-products {
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

/* 卡片视图样式 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.2rem;
  margin-top: 1rem;
  padding: 0.5rem;
}

.product-card {
  border: none;
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.product-card.special-product {
  background-color: #f8f9ff;
}

.product-card.special-product::before {
  content: "✦ 特色商品";
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ffc107;
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.product-card-header {
  padding: 1rem;
  background: linear-gradient(to right, #f8f9fa, #ffffff);
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.product-card.special-product .product-card-header {
  background: linear-gradient(to right, #fff8e1, #ffffff);
  border-bottom-color: #ffecb3;
}

.product-card-header .product-name {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

.product-card-body {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #ffffff;
}

.price-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9f9f9;
  border-radius: 10px;
  padding: 12px 15px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
}

.current-price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  background: -webkit-linear-gradient(45deg, #2c3e50, #4a6fa5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.trend-price-change {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: #f0f0f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.card-price-change {
  font-weight: 600;
  font-family: var(--font-family-numbers, 'Arial', sans-serif);
  font-size: 0.9rem;
  padding: 4px 10px;
  border-radius: 20px;
  background-color: rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  min-width: 70px;
  text-align: center;
}

.price-up {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.price-down {
  background-color: rgba(46, 204, 113, 0.1);
  color: #27ae60;
}

.price-stable {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 0.5rem;
  padding-top: 0.8rem;
  border-top: 1px solid #f0f0f0;
}

.action-row {
  display: flex;
  flex-direction: row;
  gap: 0.8rem;
  justify-content: flex-start; /* 改为左对齐 */
}

.no-products-card {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  color: #6c757d;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  font-style: italic;
  font-size: 1.1rem;
}

/* 模态框样式 */
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

.modal-container {
  width: 90%;
  max-width: 500px; /* 减小最大宽度 */
  max-height: 90vh;
  overflow-y: auto;
  background-color: white;
  border-radius: 12px; /* 增加圆角 */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2); /* 增强阴影 */
}

/* 模态框动画 */
.modal-enter-active {
  animation: modal-fade-in 0.3s ease-out forwards;
}

.modal-leave-active {
  animation: modal-fade-out 0.3s ease-in forwards;
}

.modal-enter-active .modal-container {
  animation: modal-slide-in 0.3s ease-out forwards;
}

.modal-leave-active .modal-container {
  animation: modal-slide-out 0.3s ease-in forwards;
}

@keyframes modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modal-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modal-slide-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(30px);
  }
}

/* 交易提示样式 */
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
  z-index: 9999; /* 提高z-index确保在最上层 */
  min-width: 220px;
  backdrop-filter: blur(4px);
  animation: toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  text-align: center;
  overflow: hidden;
  pointer-events: none; /* 防止提示框影响下方元素的交互 */
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
  font-weight: 500;
  letter-spacing: 0.2px;
}

.purchase-success {
  border-top: 3px solid #2ecc71;
}

.purchase-success .toast-icon {
  background-color: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.purchase-failed {
  border-top: 3px solid #e74c3c;
}

.purchase-failed .toast-icon {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.sale-success {
  border-top: 3px solid #3498db;
}

.sale-success .toast-icon {
  background-color: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.location-change {
  border-top: 3px solid #f39c12;
}

.location-change .toast-icon {
  background-color: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}
</style>
