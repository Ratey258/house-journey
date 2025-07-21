/**
 * 主Store入口文件
 * 整合所有模块化Store并提供兼容层
 */

import { defineStore } from 'pinia';
import { useGameCoreStore, useGameProgressStore } from './gameCore';
import { usePlayerStore, useInventoryActions } from './player';
import { useMarketStore, usePriceSystemStore } from './market';
import { useEventStore } from './events';
import { useSaveStore } from './persistence';

/**
 * 兼容层 - 保持与原有gameStore.js相同的API
 * 优化版本：使用getter/setter代替computed，减少响应式对象开销
 */
export const useGameStore = defineStore('gameCompat', () => {
  const gameCore = useGameCoreStore();
  const gameProgress = useGameProgressStore();
  const player = usePlayerStore();
  const market = useMarketStore();
  const priceSystem = usePriceSystemStore();
  const events = useEventStore();
  const saves = useSaveStore();
  const inventoryActions = useInventoryActions();
  
  // 返回带有getter/setter的对象，而不是使用computed
  const storeAPI = {
    // 游戏核心状态 - 使用getter/setter直接代理
    get currentWeek() { return gameProgress.currentWeek; },
    set currentWeek(value) { gameProgress.currentWeek = value; },
    
    get maxWeeks() { return gameProgress.maxWeeks; },
    get gameStarted() { return gameProgress.gameStarted; },
    get gamePaused() { return gameProgress.gamePaused; },
    get gameOver() { return gameCore.gameOver; },
    get gameResult() { return gameCore.gameResult; },
    get notifications() { return gameProgress.notifications; },
    get gameGoals() { return gameProgress.gameGoals; },
    get gameProgress() { return gameProgress.gameProgress; },
    get isGameActive() { return gameProgress.isGameActive; },
    
    // 玩家相关状态
    get player() { return player; },
    
    // 市场相关状态
    get locations() { return market.locations; },
    get currentLocation() { return market.currentLocation; },
    get productPrices() { return priceSystem.productPrices; },
    get products() { return market.products; },
    get availableProducts() { return market.availableProducts; },
    get houses() { return market.houses; },
    get marketModifiers() { return priceSystem.marketModifiers; },
    
    // 事件相关状态
    get currentEvent() { return events.currentEvent; },
    get eventHistory() { return events.eventHistory; },

    // 方法直接引用，避免创建包装函数
    // 游戏核心方法
    startNewGame(playerName) {
      // 初始化各个模块
      gameCore.startNewGame(playerName);
      gameProgress.initializeProgress();
      priceSystem.initializePriceSystem();
    },
    
    advanceWeek() {
      if (gameProgress.advanceWeek()) {
        // 更新玩家信息（债务等）
        player.updateWeeklyPlayerState(gameProgress.currentWeek);
        
        // 更新市场
        market.updateMarketState(gameProgress.currentWeek);
        
        // 检查游戏结束条件
        gameCore.checkGameEnd();
        
        return true;
      }
      return false;
    },
    
    checkGameEnd: gameCore.checkGameEnd,
    addNotification: gameProgress.addNotification,
    
    // 市场方法
    changeLocation: market.changeLocation,
    getProductPriceTrend: priceSystem.getProductPriceTrend,
    
    // 存档方法
    saveGame: saves.saveGame,
    loadGame: saves.loadGame,
    getSaves: saves.getSaves,
    
    // 更新产品价格
    updateProductPrices() {
      priceSystem.updatePrices(gameProgress.currentWeek, market.products);
    },
    
    // 更新位置产品
    updateLocationProducts() {
      market.updateLocationProducts(gameProgress.currentWeek);
    },
    
    // 生成随机事件
    generateRandomEvent() {
      events.generateRandomEvent(gameProgress.currentWeek);
    },
    
    // 获取当前产品价格
    getCurrentProductPrice(productId) {
      return priceSystem.productPrices[productId]?.price || 0;
    },
    
    // 还债方法
    repayDebt(amount) {
      if (amount <= 0 || amount > player.money) {
        return { success: false, message: '无效的还款金额' };
      }
      
      if (amount > player.debt) {
        amount = player.debt;
      }
      
      player.money -= amount;
      player.debt -= amount;
      
      return { success: true, amountRepaid: amount };
    },

    // 购买房屋方法
    buyHouse(houseId) {
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
    },
    
    // 商品购买方法
    buyProduct(productId, quantity) {
      // 确保productId是字符串类型，以便统一比较
      const productIdStr = String(productId);
      
      // 从市场可用商品中查找产品
      const product = market.availableProducts.find(p => String(p.id) === productIdStr);
      
      if (!product) {
        console.log('商品不存在:', productId, '可用商品IDs:', market.availableProducts.map(p => p.id));
        return { success: false, message: '商品不存在' };
      }
      
      // 使用字符串化的ID查找价格
      const price = priceSystem.productPrices[productIdStr]?.price;
      if (!price) {
        console.log('价格未定义:', productId, '价格列表keys:', Object.keys(priceSystem.productPrices));
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
    },
    
    // 出售商品方法
    sellProduct(productId, quantity) {
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
      const currentPrice = priceSystem.productPrices[productIdStr]?.price || 0;
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
  };

  // 使用基本价格购买的辅助函数
  function buyWithBasePrice(product, basePrice, quantity) {
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
  
  // 使用基本价格出售的辅助函数
  function sellWithBasePrice(inventoryItem, basePrice, quantity) {
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

  return storeAPI;
});

// 导出其他store
export { useGameCoreStore, useGameProgressStore } from './gameCore';
export { usePlayerStore, useInventoryActions } from './player';
export { useMarketStore, usePriceSystemStore } from './market';
export { useEventStore } from './events';
export { useSaveStore } from './persistence';
export { useSettingsStore } from './settingsStore';
export { useUiStore } from './uiStore'; 