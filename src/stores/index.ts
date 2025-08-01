/**
 * 主Store入口文件 - TypeScript版本
 * 整合所有模块化Store并提供兼容层
 */

import { defineStore } from 'pinia';
import { computed, type ComputedRef } from 'vue';
import { useGameCoreStore, type GameCoreStore } from './gameCore';
import { usePlayerStore, useInventoryActions, type PlayerStore, type InventoryActions } from './player';
import { useMarketStore, type MarketStore } from './market';
import { useEventStore, type EventStore } from './events';
import { useSaveStore, type SaveStore } from './persistence';

// ==================== 类型定义 ====================

/**
 * 交易结果接口
 */
export interface TransactionResult {
  success: boolean;
  message?: string;
  income?: number;
  profit?: number;
  profitPercent?: string | number;
  amountRepaid?: number;
}

/**
 * 产品购买/销售基本参数
 */
export interface ProductTransactionParams {
  productId: string | number;
  quantity: number;
}

/**
 * 房屋购买参数
 */
export interface HousePurchaseParams {
  houseId: string | number;
}

/**
 * 通知类型
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * 兼容层Store接口 - 保持与原有gameStore.js相同的API
 */
export interface GameStore {
  // === 状态属性 ===
  currentWeek: ComputedRef<number>;
  maxWeeks: ComputedRef<number>;
  gameStarted: ComputedRef<boolean>;
  gamePaused: ComputedRef<boolean>;
  gameOver: ComputedRef<boolean>;
  gameResult: ComputedRef<any>;
  notifications: ComputedRef<any[]>;
  gameGoals: ComputedRef<any>;
  gameProgress: ComputedRef<any>;
  isGameActive: ComputedRef<boolean>;
  player: ComputedRef<PlayerStore>;
  locations: ComputedRef<any[]>;
  currentLocation: ComputedRef<any>;
  productPrices: ComputedRef<Record<string, any>>;
  products: ComputedRef<any[]>;
  availableProducts: ComputedRef<any[]>;
  houses: ComputedRef<any[]>;
  marketModifiers: ComputedRef<any>;
  currentEvent: ComputedRef<any>;
  eventHistory: ComputedRef<any[]>;

  // === 核心游戏方法 ===
  startNewGame: (playerName: string) => void;
  advanceWeek: () => boolean;
  checkGameEnd: () => void;
  addNotification: (type: NotificationType, message: string) => void;

  // === 位置和市场方法 ===
  changeLocation: (locationId: string | number) => boolean;
  updateProductPrices: () => void;
  updateLocationProducts: () => void;
  getCurrentProductPrice: (productId: string | number) => number;
  getProductPriceTrend: (productId: string | number) => any;

  // === 交易方法 ===
  buyProduct: (productId: string | number, quantity: number) => TransactionResult;
  sellProduct: (productId: string | number, quantity: number) => TransactionResult;
  buyHouse: (houseId: string | number) => TransactionResult;
  repayDebt: (amount: number) => TransactionResult;

  // === 事件方法 ===
  generateRandomEvent: () => void;

  // === 存档方法 ===
  saveGame: (saveName: string, isAutoSave?: boolean) => any;
  loadGame: (saveId: string) => any;
  getSaves: () => any[];
}

// ==================== Store实现 ====================

/**
 * 兼容层 - 保持与原有gameStore.js相同的API
 * 允许现有组件继续使用原来的API，同时逐步迁移到新的模块化结构
 */
export const useGameStore = defineStore('gameCompat', (): GameStore => {
  const gameCore = useGameCoreStore();
  const player = usePlayerStore();
  const market = useMarketStore();
  const events = useEventStore();
  const saves = useSaveStore();
  const inventoryActions = useInventoryActions();

  // ==================== 状态计算属性 ====================

  const currentWeek = computed(() => gameCore.currentWeek);
  const maxWeeks = computed(() => gameCore.maxWeeks);
  const gameStarted = computed(() => gameCore.gameStarted);
  const gamePaused = computed(() => gameCore.gamePaused);
  const gameOver = computed(() => gameCore.gameOver);
  const gameResult = computed(() => gameCore.gameResult);
  const notifications = computed(() => gameCore.notifications);
  const gameGoals = computed(() => gameCore.gameGoals);
  const gameProgress = computed(() => gameCore.gameProgress);
  const isGameActive = computed(() => gameCore.isGameActive);

  // 玩家相关状态
  const playerState = computed(() => player);

  // 市场相关状态
  const locations = computed(() => market.locations);
  const currentLocation = computed(() => market.currentLocation);
  const productPrices = computed(() => market.productPrices);
  const products = computed(() => market.products);
  const availableProducts = computed(() => market.availableProducts);
  const houses = computed(() => market.houses);
  const marketModifiers = computed(() => market.marketModifiers);

  // 事件相关状态
  const currentEvent = computed(() => events.currentEvent);
  const eventHistory = computed(() => events.eventHistory);

  // ==================== 核心游戏方法 ====================

  function startNewGame(playerName: string): void {
    gameCore.startNewGame(playerName);
  }

  function advanceWeek(): boolean {
    return gameCore.advanceWeek();
  }

  function checkGameEnd(): void {
    gameCore.checkGameEnd();
  }

  function addNotification(type: NotificationType, message: string): void {
    gameCore.addNotification(type, message);
  }

  // ==================== 位置和市场方法 ====================

  function changeLocation(locationId: string | number): boolean {
    return market.changeLocation(locationId);
  }

  function updateProductPrices(): void {
    market.updateProductPrices(gameCore.currentWeek);
  }

  function updateLocationProducts(): void {
    market.updateLocationProducts(gameCore.currentWeek);
  }

  function generateRandomEvent(): void {
    events.generateRandomEvent(gameCore.currentWeek);
  }

  function getCurrentProductPrice(productId: string | number): number {
    if (!productId) return 0;

    // 确保将productId转换为字符串进行比较
    const productIdStr = String(productId);

    const price = market.productPrices[productIdStr]?.price;
    if (price !== undefined && price !== null) {
      return price;
    }

    // 如果在productPrices中找不到价格，尝试从products列表中获取basePrice
    const product = market.products.find(p => String(p.id) === productIdStr);
    if (product && product.basePrice) {
      return product.basePrice;
    }

    return 0;
  }

  function getProductPriceTrend(productId: string | number): any {
    return market.getProductPriceTrend(productId);
  }

  // ==================== 交易方法 ====================

  function buyProduct(productId: string | number, quantity: number): TransactionResult {
    // 确保productId是字符串类型，以便统一比较
    const productIdStr = String(productId);

    // 从市场可用商品中查找产品
    const product = market.availableProducts.find(p => String(p.id) === productIdStr);

    if (!product) {
      console.log('商品不存在:', productId, '可用商品IDs:', market.availableProducts.map(p => p.id));
      return { success: false, message: '商品不存在' };
    }

    // 使用字符串化的ID查找价格
    const price = market.productPrices[productIdStr]?.price;
    if (!price) {
      console.log('价格未定义:', productId, '价格列表keys:', Object.keys(market.productPrices));
      // 尝试获取商品的基本价格
      const basePrice = product.basePrice || 0;
      if (basePrice > 0) {
        console.log('使用商品基本价格:', basePrice);
        return buyWithBasePrice(product, basePrice, quantity);
      }
      return { success: false, message: '价格未定义' };
    }

    const totalCost = price * quantity;
    if (player.money < totalCost) {
      return { success: false, message: '资金不足' };
    }

    const addResult = inventoryActions.addToInventory(product, quantity, price);
    if (!addResult.success) {
      return addResult;
    }

    player.money -= totalCost;
    player.statistics.transactionCount += 1;

    return { success: true };
  }

  function sellProduct(productId: string | number, quantity: number): TransactionResult {
    // 参数验证
    if (!productId || quantity <= 0) {
      return { success: false, message: '无效的参数' };
    }

    // 确保productId是字符串类型，以便统一比较
    const productIdStr = String(productId);

    // 查找玩家库存中的商品（现在只会有一个条目，因为我们按产品ID合并了）
    const inventoryItem = player.inventory.find(item => String(item.productId) === productIdStr);
    if (!inventoryItem) {
      console.log('物品不存在于库存中:', productId, '库存物品IDs:', player.inventory.map(item => item.productId));
      return { success: false, message: '物品不存在' };
    }

    // 检查数量是否足够
    if (inventoryItem.quantity < quantity) {
      return { success: false, message: '数量不足' };
    }

    // 获取当前市场价格，使用字符串化的ID
    const currentPrice = market.productPrices[productIdStr]?.price || 0;
    if (currentPrice <= 0) {
      console.log('当前市场不收购此物品:', productId, '价格:', currentPrice);
      // 尝试查找商品基本价格
      const product = market.products.find(p => String(p.id) === productIdStr);
      if (product && product.basePrice > 0) {
        console.log('使用商品基本价格出售:', product.basePrice);
        return sellWithBasePrice(inventoryItem, product.basePrice, quantity);
      }
      return { success: false, message: '当前市场不收购此物品' };
    }

    // 计算总收入
    const totalIncome = currentPrice * quantity;

    // 使用平均购买价格计算成本
    const inventoryIndex = player.inventory.indexOf(inventoryItem);
    const avgPurchasePrice = inventoryItem.purchasePrice;
    const totalCost = avgPurchasePrice * quantity;

    // 从库存中移除物品
    const removeResult = inventoryActions.removeFromInventory(inventoryIndex, quantity);
    if (!removeResult.success) {
      return { success: false, message: '出售失败：' + removeResult.message };
    }

    // 计算利润
    const profit = totalIncome - totalCost;

    // 更新玩家资金和统计数据
    player.money += totalIncome;
    player.statistics.totalProfit += profit;
    player.statistics.transactionCount += 1;

    // 返回成功结果
    return {
      success: true,
      income: totalIncome,
      profit: profit,
      profitPercent: totalCost > 0 ? (profit / totalCost * 100).toFixed(1) : 0
    };
  }

  function buyHouse(houseId: string | number): TransactionResult {
    const house = market.houses.find(h => h.id === houseId);
    if (!house) {
      return { success: false, message: '房屋不存在' };
    }

    if (player.money < house.price) {
      return { success: false, message: '资金不足' };
    }

    if (player.purchasedHouses.some(h => h.houseId === houseId)) {
      return { success: false, message: '已拥有此房屋' };
    }

    player.money -= house.price;
    player.purchasedHouses.push({
      houseId: house.id,
      name: house.name,
      purchasePrice: house.price,
      purchaseDate: new Date().toISOString()
    });

    // 检查游戏结束条件
    gameCore.checkGameEnd();

    return { success: true };
  }

  function repayDebt(amount: number): TransactionResult {
    if (amount <= 0 || amount > player.money) {
      return { success: false, message: '无效的还款金额' };
    }

    if (amount > player.debt) {
      amount = player.debt;
    }

    player.money -= amount;
    player.debt -= amount;

    return { success: true, amountRepaid: amount };
  }

  // ==================== 存档方法 ====================

  function saveGame(saveName: string, isAutoSave: boolean = false): any {
    return saves.saveGame(saveName, isAutoSave);
  }

  function loadGame(saveId: string): any {
    return saves.loadGame(saveId);
  }

  function getSaves(): any[] {
    return saves.getSaves();
  }

  // ==================== 辅助方法 ====================

  /**
   * 使用基本价格购买的辅助函数
   */
  function buyWithBasePrice(product: any, basePrice: number, quantity: number): TransactionResult {
    const totalCost = basePrice * quantity;
    if (player.money < totalCost) {
      return { success: false, message: '资金不足' };
    }

    const addResult = inventoryActions.addToInventory(product, quantity, basePrice);
    if (!addResult.success) {
      return addResult;
    }

    player.money -= totalCost;
    player.statistics.transactionCount += 1;

    return { success: true };
  }

  /**
   * 使用基本价格出售的辅助函数
   */
  function sellWithBasePrice(inventoryItem: any, basePrice: number, quantity: number): TransactionResult {
    // 计算总收入
    const totalIncome = basePrice * quantity;

    // 使用平均购买价格计算成本
    const inventoryIndex = player.inventory.indexOf(inventoryItem);
    const avgPurchasePrice = inventoryItem.purchasePrice;
    const totalCost = avgPurchasePrice * quantity;

    // 从库存中移除物品
    const removeResult = inventoryActions.removeFromInventory(inventoryIndex, quantity);
    if (!removeResult.success) {
      return { success: false, message: '出售失败：' + removeResult.message };
    }

    // 计算利润
    const profit = totalIncome - totalCost;

    // 更新玩家资金和统计数据
    player.money += totalIncome;
    player.statistics.totalProfit += profit;
    player.statistics.transactionCount += 1;

    // 返回成功结果
    return {
      success: true,
      income: totalIncome,
      profit: profit,
      profitPercent: totalCost > 0 ? (profit / totalCost * 100).toFixed(1) : 0
    };
  }

  // ==================== 返回兼容API ====================

  return {
    // 状态
    currentWeek,
    maxWeeks,
    gameStarted,
    gamePaused,
    gameOver,
    gameResult,
    notifications,
    gameGoals,
    gameProgress,
    isGameActive,
    player: playerState,
    locations,
    currentLocation,
    productPrices,
    products,
    availableProducts,
    houses,
    marketModifiers,
    currentEvent,
    eventHistory,

    // 方法
    startNewGame,
    advanceWeek,
    changeLocation,
    updateProductPrices,
    updateLocationProducts,
    generateRandomEvent,
    buyProduct,
    sellProduct,
    saveGame,
    loadGame,
    getSaves,
    checkGameEnd,
    getCurrentProductPrice,
    getProductPriceTrend,
    repayDebt,
    buyHouse,
    addNotification
  };
});

// ==================== 导出其他Store ====================

export { useGameCoreStore, type GameCoreStore } from './gameCore';
export { usePlayerStore, useInventoryActions, type PlayerStore, type InventoryActions } from './player';
export { useMarketStore, type MarketStore } from './market';
export { useEventStore, type EventStore } from './events';
export { useSaveStore, type SaveStore } from './persistence';
export { useSettingsStore } from './settingsStore';
export { useUiStore } from './uiStore';

// ==================== 默认导出 ====================

export default useGameStore;
