/**
 * 增强版市场状态管理
 * 使用事件总线减少store之间的直接依赖
 */
import { defineStore } from 'pinia';
import { ref, computed, onUnmounted } from 'vue';
import eventBus from '../../infrastructure/state/event-bus';
import repositoryFactory from '../../infrastructure/persistence/repository-factory';
import enhancedContainer from '../../infrastructure/di/container-setup';
import { withErrorHandling } from '../../infrastructure/utils/errorHandler';
import { ErrorType } from '../../infrastructure/utils/errorTypes';

/**
 * 市场状态类型定义
 * @typedef {Object} MarketState
 * @property {Object[]} products 商品列表
 * @property {Object} priceHistory 价格历史
 * @property {Object} modifiers 市场修正因子
 * @property {number} currentWeek 当前周
 * @property {Object[]} locations 地点列表
 * @property {Object} currentLocation 当前地点
 * @property {boolean} isLoading 是否正在加载
 */

/**
 * 增强版市场状态存储
 * 使用事件总线通信而非直接引用其他store
 */
export const useMarketStoreEnhanced = defineStore('market', () => {
  // 状态
  const products = ref([]);
  const priceHistory = ref({});
  const modifiers = ref({});
  const currentWeek = ref(1);
  const locations = ref([]);
  const currentLocation = ref(null);
  const isLoading = ref(false);

  // 仓储和服务
  const marketRepository = repositoryFactory.getMarketRepository();
  const marketService = enhancedContainer.resolve('IMarketService');

  // 计算属性
  const activeProducts = computed(() => {
    // 根据当前地点过滤商品
    if (!currentLocation.value) return [];

    return products.value.filter(product => {
      // 实现过滤逻辑
      return true;
    });
  });

  // 事件监听清理函数
  const eventCleanups = [];

  // 注册事件监听
  eventCleanups.push(eventBus.on('WEEK_CHANGED', handleWeekChange));
  eventCleanups.push(eventBus.on('PLAYER_MONEY_CHANGED', updateMarketModifiers));

  // 清理事件监听
  onUnmounted(() => {
    eventCleanups.forEach(cleanup => cleanup());
  });

  /**
   * 处理周变化事件
   * @param {number} week 新的周数
   */
  function handleWeekChange(week) {
    currentWeek.value = week;
    updatePrices(week);
  }

  /**
   * 更新市场修正因子
   * @param {number} playerMoney 玩家资金
   */
  function updateMarketModifiers(playerMoney) {
    // 根据玩家资金更新市场修正因子
    const newModifiers = { ...modifiers.value };

    // 根据玩家资金计算全局修正因子
    newModifiers.globalPriceModifier = calculateGlobalModifier(playerMoney);

    modifiers.value = newModifiers;
  }

  /**
   * 计算全局修正因子
   * @param {number} playerMoney 玩家资金
   * @returns {number} 全局修正因子
   */
  function calculateGlobalModifier(playerMoney) {
    // 示例：玩家资金越多，价格越高
    const baseFactor = 1.0;
    const wealthFactor = Math.min(playerMoney / 100000, 0.2); // 最大+20%
    return baseFactor + wealthFactor;
  }

  /**
   * 更新价格
   * @param {number} week 周数
   */
  async function updatePrices(week) {
    return withErrorHandling(async () => {
      isLoading.value = true;

      try {
        const result = await marketService.updateMarketPrices(week);
        priceHistory.value = result.priceHistory || priceHistory.value;

        // 如果有当前地点，更新地点商品
        if (currentLocation.value) {
          await updateLocationProducts(currentLocation.value.id, week);
        }

        // 发布价格更新事件
        eventBus.emit('PRICES_UPDATED', {
          week,
          priceHistory: priceHistory.value
        });
      } finally {
        isLoading.value = false;
      }
    }, 'MarketStoreEnhanced.updatePrices', ErrorType.GAME_LOGIC);
  }

  /**
   * 更新地点商品
   * @param {string} locationId 地点ID
   * @param {number} week 周数
   */
  async function updateLocationProducts(locationId, week) {
    return withErrorHandling(async () => {
      isLoading.value = true;

      try {
        const result = await marketService.updateLocationProducts(locationId, week);
        products.value = result || [];

        // 发布地点商品更新事件
        eventBus.emit('LOCATION_PRODUCTS_UPDATED', {
          locationId,
          products: products.value
        });
      } finally {
        isLoading.value = false;
      }
    }, 'MarketStoreEnhanced.updateLocationProducts', ErrorType.GAME_LOGIC);
  }

  /**
   * 切换地点
   * @param {string} locationId 地点ID
   */
  async function changeLocation(locationId) {
    return withErrorHandling(async () => {
      isLoading.value = true;

      try {
        const result = await marketService.changeLocation(locationId, currentWeek.value);

        if (result.success) {
          currentLocation.value = result.location;
          products.value = result.products || [];

          // 发布地点变更事件
          eventBus.emit('LOCATION_CHANGED', {
            location: currentLocation.value,
            products: products.value
          });
        }

        return result;
      } finally {
        isLoading.value = false;
      }
    }, 'MarketStoreEnhanced.changeLocation', ErrorType.GAME_LOGIC);
  }

  /**
   * 初始化市场
   */
  async function initialize() {
    return withErrorHandling(async () => {
      isLoading.value = true;

      try {
        const marketStatus = await marketService.getMarketStatus();

        products.value = marketStatus.products || [];
        priceHistory.value = marketStatus.priceHistory || {};
        modifiers.value = marketStatus.modifiers || {};
        locations.value = marketStatus.locations || [];

        if (marketStatus.currentLocation) {
          currentLocation.value = marketStatus.currentLocation;
        }

        // 发布市场初始化事件
        eventBus.emit('MARKET_INITIALIZED', marketStatus);
      } finally {
        isLoading.value = false;
      }
    }, 'MarketStoreEnhanced.initialize', ErrorType.INITIALIZATION);
  }

  /**
   * 交易商品
   * @param {string} productId 产品ID
   * @param {number} quantity 数量
   * @param {boolean} isBuying 是否为购买操作
   * @returns {Promise<Object>} 交易结果
   */
  async function tradeProduct(productId, quantity, isBuying) {
    return withErrorHandling(async () => {
      const result = await marketService.tradeProduct(productId, quantity, isBuying);

      if (result.success) {
        // 发布交易成功事件
        eventBus.emit('TRADE_COMPLETED', {
          productId,
          quantity,
          isBuying,
          price: result.price
        });
      }

      return result;
    }, 'MarketStoreEnhanced.tradeProduct', ErrorType.GAME_LOGIC);
  }

  return {
    // 状态
    products,
    priceHistory,
    modifiers,
    currentWeek,
    locations,
    currentLocation,
    isLoading,

    // 计算属性
    activeProducts,

    // 方法
    initialize,
    updatePrices,
    updateLocationProducts,
    changeLocation,
    tradeProduct
  };
});
