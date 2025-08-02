/**
 * Store兼容层实现 - TypeScript版本
 * 保持与原有gameStore.js相同的API，允许现有组件继续使用原来的API
 */

import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useGameCoreStore } from './gameCore';
import { usePlayerStore, useInventoryActions } from './player';
import { useMarketStore } from './market';
import { useEventStore } from './events';
import { useSaveStore } from './persistence';
import type { GameStore, NotificationType, TransactionResult } from './types';
import { 
  createProductPurchaseValidator, 
  createHousePurchaseValidator, 
  createDebtRepaymentValidator,
  validateObject,
  isAllValid,
  collectErrors
} from '../infrastructure/utils/validation';

/**
 * 兼容层Store - 整合所有模块化Store
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

    const productIdStr = String(productId);
    const price = market.productPrices[productIdStr]?.price;
    
    if (price !== undefined && price !== null) {
      return price;
    }

    // 如果在productPrices中找不到，尝试从products列表中获取basePrice
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
    // 参数验证
    const validators = createProductPurchaseValidator();
    const validationResults = validateObject({ productId, quantity }, validators);
    
    if (!isAllValid(validationResults)) {
      const errors = collectErrors(validationResults);
      return { success: false, message: errors.join('; ') };
    }

    const productIdStr = String(productId);
    const product = market.availableProducts.find(p => String(p.id) === productIdStr);

    if (!product) {
      return { success: false, message: '商品不存在' };
    }

    const price = market.productPrices[productIdStr]?.price;
    if (!price || price <= 0) {
      const basePrice = product.basePrice || 0;
      if (basePrice > 0) {
        return buyWithBasePrice(product, basePrice, quantity);
      }
      return { success: false, message: '价格未定义或无效' };
    }

    // 计算成本和资金验证
    const totalCost = price * quantity;
    if (!Number.isFinite(totalCost) || totalCost <= 0) {
      return { success: false, message: '计算出的总费用无效' };
    }

    if (player.money < totalCost) {
      return { 
        success: false, 
        message: `资金不足，需要¥${totalCost.toFixed(2)}，当前仅有¥${player.money.toFixed(2)}` 
      };
    }

    // 库存操作验证
    const addResult = inventoryActions.addToInventory(product, quantity, price);
    if (!addResult.success) {
      return addResult;
    }

    // 执行交易
    const moneySuccess = player.updateMoney(-totalCost);
    if (!moneySuccess) {
      return { success: false, message: '资金扣除失败' };
    }
    player.incrementTransactionCount();

    return { success: true };
  }

  function sellProduct(productId: string | number, quantity: number): TransactionResult {
    // 参数验证
    const validators = createProductPurchaseValidator();
    const validationResults = validateObject({ productId, quantity }, validators);
    
    if (!isAllValid(validationResults)) {
      const errors = collectErrors(validationResults);
      return { success: false, message: errors.join('; ') };
    }

    const productIdStr = String(productId);
    
    // 库存检查和移除
    const removeResult = inventoryActions.removeFromInventoryByProductId(productIdStr, quantity);
    if (!removeResult.success) {
      return removeResult;
    }

    // 价格获取和验证
    const currentPrice = getCurrentProductPrice(productId);
    if (currentPrice <= 0) {
      return { success: false, message: '当前商品价格无效，无法销售' };
    }

    // 计算收入
    const totalIncome = currentPrice * quantity;
    if (!Number.isFinite(totalIncome) || totalIncome < 0) {
      return { success: false, message: '计算出的总收入无效' };
    }
    
    // 执行销售
    const moneySuccess = player.updateMoney(totalIncome);
    if (!moneySuccess) {
      return { success: false, message: '收入添加失败' };
    }
    player.incrementTransactionCount();

    // 计算利润
    const product = removeResult.product;
    const purchasePrice = product?.purchasePrice || 0;
    const profit = (currentPrice - purchasePrice) * quantity;
    const profitPercent = purchasePrice > 0 ? ((currentPrice / purchasePrice - 1) * 100) : 0;

    return {
      success: true,
      income: totalIncome,
      profit: profit,
      profitPercent: profitPercent
    };
  }

  function buyHouse(houseId: string | number): TransactionResult {
    // 参数验证
    const validators = createHousePurchaseValidator();
    const validationResults = validateObject({ 
      houseId, 
      playerMoney: player.money 
    }, validators);
    
    if (!isAllValid(validationResults)) {
      const errors = collectErrors(validationResults);
      return { success: false, message: errors.join('; ') };
    }

    const houseIdStr = String(houseId);
    const house = market.houses.find(h => String(h.id) === houseIdStr);

    if (!house) {
      return { success: false, message: '房产不存在' };
    }

    // 价格验证
    if (!house.price || house.price <= 0 || !Number.isFinite(house.price)) {
      return { success: false, message: '房产价格无效' };
    }

    // 资金充足性检查
    if (player.money < house.price) {
      return { 
        success: false, 
        message: `资金不足，需要¥${house.price.toFixed(2)}，当前仅有¥${player.money.toFixed(2)}` 
      };
    }

    // 检查是否已经购买过同一房产
    const alreadyOwned = player.purchasedHouses?.some(h => String(h.id) === houseIdStr);
    if (alreadyOwned) {
      return { success: false, message: '您已经拥有这套房产了' };
    }

    // 执行购买
    const success = player.purchaseHouse(house);
    if (!success) {
      return { success: false, message: '购买失败' };
    }

    return { success: true };
  }

  function repayDebt(amount: number): TransactionResult {
    // 参数验证
    const validators = createDebtRepaymentValidator();
    const validationResults = validateObject({ 
      amount, 
      playerMoney: player.money,
      currentDebt: player.debt
    }, validators);
    
    if (!isAllValid(validationResults)) {
      const errors = collectErrors(validationResults);
      return { success: false, message: errors.join('; ') };
    }

    // 检查是否有债务需要偿还
    if (player.debt <= 0) {
      return { success: false, message: '您当前没有债务需要偿还' };
    }

    // 计算实际偿还金额
    const actualRepayAmount = Math.min(amount, player.debt);
    if (actualRepayAmount <= 0) {
      return { success: false, message: '偿还金额无效' };
    }

    // 资金检查
    if (player.money < actualRepayAmount) {
      return { 
        success: false, 
        message: `资金不足，需要¥${actualRepayAmount.toFixed(2)}，当前仅有¥${player.money.toFixed(2)}` 
      };
    }

    // 执行偿还
    const success = player.repayLoan(actualRepayAmount);
    if (!success) {
      return { success: false, message: '偿还失败' };
    }

    return {
      success: true,
      amountRepaid: actualRepayAmount
    };
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

  // ==================== 辅助函数 ====================

  function buyWithBasePrice(product: any, basePrice: number, quantity: number): TransactionResult {
    const totalCost = basePrice * quantity;
    
    if (player.money < totalCost) {
      return { success: false, message: '资金不足' };
    }

    const addResult = inventoryActions.addToInventory(product, quantity, basePrice);
    if (!addResult.success) {
      return addResult;
    }

    const moneySuccess = player.updateMoney(-totalCost);
    if (!moneySuccess) {
      return { success: false, message: '资金扣除失败' };
    }
    player.incrementTransactionCount();

    return { success: true };
  }

  // ==================== 返回API ====================

  return {
    // 状态属性
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
    checkGameEnd,
    addNotification,
    changeLocation,
    updateProductPrices,
    updateLocationProducts,
    getCurrentProductPrice,
    getProductPriceTrend,
    buyProduct,
    sellProduct,
    buyHouse,
    repayDebt,
    generateRandomEvent,
    saveGame,
    loadGame,
    getSaves
  };
});