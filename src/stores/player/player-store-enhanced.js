/**
 * 增强版玩家状态管理
 * 使用事件总线减少store之间的直接依赖
 */
import { defineStore } from 'pinia';
import { ref, computed, onUnmounted } from 'vue';
import eventBus from '../../infrastructure/state/event-bus';
import repositoryFactory from '../../infrastructure/persistence/repository-factory';
import { withErrorHandling } from '../../infrastructure/utils/errorHandler';
import { ErrorType } from '../../infrastructure/utils/errorTypes';

/**
 * 玩家状态类型定义
 * @typedef {Object} PlayerState
 * @property {string} name 玩家名称
 * @property {number} money 资金
 * @property {Object[]} inventory 物品库存
 * @property {Object} statistics 统计数据
 * @property {boolean} isLoading 是否正在加载
 */

/**
 * 增强版玩家状态存储
 * 使用事件总线通信而非直接引用其他store
 */
export const usePlayerStoreEnhanced = defineStore('player', () => {
  // 状态
  const name = ref('玩家');
  const money = ref(10000);
  const inventory = ref([]);
  const statistics = ref({
    weeksPlayed: 0,
    transactionCount: 0,
    totalProfit: 0,
    highestBalance: 10000
  });
  const isLoading = ref(false);

  // 仓储
  const playerRepository = repositoryFactory.getPlayerRepository();

  // 计算属性
  const inventoryValue = computed(() => {
    return inventory.value.reduce((total, item) => {
      return total + (item.quantity * item.purchasePrice);
    }, 0);
  });

  const netWorth = computed(() => {
    return money.value + inventoryValue.value;
  });

  // 事件监听清理函数
  const eventCleanups = [];

  // 注册事件监听
  eventCleanups.push(eventBus.on('WEEK_CHANGED', handleWeekChange));
  eventCleanups.push(eventBus.on('TRADE_COMPLETED', handleTradeCompleted));
  eventCleanups.push(eventBus.on('EVENT_COMPLETED', handleEventCompleted));

  // 清理事件监听
  onUnmounted(() => {
    eventCleanups.forEach(cleanup => cleanup());
  });

  /**
   * 处理周变化事件
   * @param {number} week 新的周数
   */
  function handleWeekChange(week) {
    statistics.value.weeksPlayed = week;

    // 存储玩家状态
    savePlayerState();
  }

  /**
   * 处理交易完成事件
   * @param {Object} trade 交易信息
   */
  function handleTradeCompleted(trade) {
    // 交易已通过市场服务处理，这里只需要更新玩家状态
    loadPlayerState();
  }

  /**
   * 处理事件完成
   * @param {Object} event 事件信息
   */
  function handleEventCompleted(event) {
    // 事件可能影响玩家状态，重新加载
    loadPlayerState();
  }

  /**
   * 加载玩家状态
   * @returns {Promise<void>}
   */
  async function loadPlayerState() {
    return withErrorHandling(async () => {
      isLoading.value = true;

      try {
        const player = await playerRepository.getPlayer();

        name.value = player.name;
        money.value = player.money;
        inventory.value = player.inventory || [];
        statistics.value = player.statistics || {
          weeksPlayed: 0,
          transactionCount: 0,
          totalProfit: 0,
          highestBalance: player.money
        };

        // 发布玩家状态更新事件
        eventBus.emit('PLAYER_STATE_UPDATED', {
          money: money.value,
          inventory: inventory.value
        });

        // 发布玩家资金变化事件
        eventBus.emit('PLAYER_MONEY_CHANGED', money.value);
      } finally {
        isLoading.value = false;
      }
    }, 'PlayerStoreEnhanced.loadPlayerState', ErrorType.DATA_ACCESS);
  }

  /**
   * 存储玩家状态
   * @returns {Promise<void>}
   */
  async function savePlayerState() {
    return withErrorHandling(async () => {
      const player = {
        id: 'current-player',
        name: name.value,
        money: money.value,
        inventory: inventory.value,
        statistics: {
          ...statistics.value,
          highestBalance: Math.max(statistics.value.highestBalance, money.value)
        }
      };

      await playerRepository.savePlayer(player);
    }, 'PlayerStoreEnhanced.savePlayerState', ErrorType.DATA_ACCESS);
  }

  /**
   * 添加资金
   * @param {number} amount 金额
   */
  function addMoney(amount) {
    if (amount <= 0) return;

    money.value += amount;

    // 更新最高余额
    if (money.value > statistics.value.highestBalance) {
      statistics.value.highestBalance = money.value;
    }

    // 发布玩家资金变化事件
    eventBus.emit('PLAYER_MONEY_CHANGED', money.value);

    // 存储玩家状态
    savePlayerState();
  }

  /**
   * 消费资金
   * @param {number} amount 金额
   * @returns {boolean} 是否成功
   */
  function spendMoney(amount) {
    if (amount <= 0) return true;
    if (money.value < amount) return false;

    money.value -= amount;

    // 发布玩家资金变化事件
    eventBus.emit('PLAYER_MONEY_CHANGED', money.value);

    // 存储玩家状态
    savePlayerState();

    return true;
  }

  /**
   * 添加物品到库存
   * @param {Object} product 产品对象
   * @param {number} quantity 数量
   * @param {number} purchasePrice 购买价格
   * @returns {boolean} 是否成功
   */
  function addToInventory(product, quantity, purchasePrice) {
    if (quantity <= 0) return false;

    // 查找是否已有同类物品
    const existingItem = inventory.value.find(item => item.productId === product.id);

    if (existingItem) {
      // 更新现有物品
      const oldValue = existingItem.quantity * existingItem.purchasePrice;
      const newValue = quantity * purchasePrice;
      const totalValue = oldValue + newValue;
      const totalQuantity = existingItem.quantity + quantity;

      // 计算新的平均价格
      existingItem.purchasePrice = totalValue / totalQuantity;
      existingItem.quantity = totalQuantity;
    } else {
      // 添加新物品
      inventory.value.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity,
        purchasePrice
      });
    }

    // 发布库存更新事件
    eventBus.emit('INVENTORY_UPDATED', inventory.value);

    // 存储玩家状态
    savePlayerState();

    return true;
  }

  /**
   * 从库存中移除物品
   * @param {string} productId 产品ID
   * @param {number} quantity 数量
   * @returns {boolean} 是否成功
   */
  function removeFromInventory(productId, quantity) {
    if (quantity <= 0) return false;

    // 查找物品
    const itemIndex = inventory.value.findIndex(item => item.productId === productId);

    if (itemIndex === -1) return false;

    const item = inventory.value[itemIndex];

    if (item.quantity < quantity) return false;

    // 更新物品数量
    item.quantity -= quantity;

    // 如果数量为零，移除物品
    if (item.quantity === 0) {
      inventory.value.splice(itemIndex, 1);
    }

    // 发布库存更新事件
    eventBus.emit('INVENTORY_UPDATED', inventory.value);

    // 存储玩家状态
    savePlayerState();

    return true;
  }

  /**
   * 初始化玩家状态
   * @returns {Promise<void>}
   */
  async function initialize() {
    return withErrorHandling(async () => {
      await loadPlayerState();
    }, 'PlayerStoreEnhanced.initialize', ErrorType.INITIALIZATION);
  }

  /**
   * 重置玩家状态
   * @param {Object} options 重置选项
   * @returns {Promise<void>}
   */
  async function resetPlayer(options = {}) {
    return withErrorHandling(async () => {
      const player = await playerRepository.resetPlayer(options);

      name.value = player.name;
      money.value = player.money;
      inventory.value = [];
      statistics.value = player.statistics;

      // 发布玩家重置事件
      eventBus.emit('PLAYER_RESET', player);
    }, 'PlayerStoreEnhanced.resetPlayer', ErrorType.GAME_LOGIC);
  }

  return {
    // 状态
    name,
    money,
    inventory,
    statistics,
    isLoading,

    // 计算属性
    inventoryValue,
    netWorth,

    // 方法
    initialize,
    loadPlayerState,
    savePlayerState,
    addMoney,
    spendMoney,
    addToInventory,
    removeFromInventory,
    resetPlayer
  };
});
