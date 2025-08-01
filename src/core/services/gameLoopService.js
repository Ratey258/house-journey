import { getAllProducts } from '../models/product';
import { getAllLocations } from '../models/location';
import { getAllHouses } from '../models/house';
import { getAllEvents } from '../models/event';
import { createPlayer, createPlayerProduct } from '../models/player';
import { EventSystem } from './eventSystem';
import { generateLocationProducts } from './priceSystem';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';

/**
 * 初始化游戏数据
 * 返回基础游戏数据对象
 */
export function initializeGame() {
  return {
    products: getAllProducts(),
    locations: getAllLocations(),
    houses: getAllHouses(),
    events: getAllEvents()
  };
}

/**
 * 获取随机事件
 * @param {Object} gameState 游戏状态
 * @returns {Object|null} 事件对象或null
 */
export function getRandomEvent(gameState) {
  const eventSystem = new EventSystem(getAllEvents());
  return eventSystem.checkForEvents(gameState);
}

/**
 * 游戏引擎
 * 管理游戏核心逻辑和状态
 */
export class GameEngine {
  constructor() {
    // 初始化游戏数据
    this.products = getAllProducts();
    this.locations = getAllLocations();
    this.houses = getAllHouses();

    // 初始化系统
    this.eventSystem = new EventSystem(getAllEvents());

    // 游戏状态
    this.state = {
      currentWeek: 1,
      maxWeeks: 52,
      gameStarted: false,
      gamePaused: false,
      gameOver: false,
      player: null,
      currentLocation: null,
      marketProducts: [],
      activeEvent: null,
      saveTimestamp: null
    };
  }

  /**
   * 创建新游戏
   * @param {string} playerName 玩家名称
   * @param {string} difficulty 游戏难度
   */
  newGame(playerName, difficulty = 'standard') {
    // 创建玩家
    this.state.player = createPlayer(playerName);

    // 设置初始状态
    this.state.currentWeek = 1;
    this.state.gameStarted = true;
    this.state.gamePaused = false;
    this.state.gameOver = false;

    // 调整难度
    this.applyDifficulty(difficulty);

    // 设置初始地点
    this.changeLocation(this.locations[0].id);

    return this.state;
  }

  /**
   * 应用游戏难度设置
   * @param {string} difficulty 难度级别
   */
  applyDifficulty(difficulty) {
    switch (difficulty) {
      case 'easy':
        this.state.player.money = 5000;
        this.state.player.debt = 2000;
        break;
      case 'hard':
        this.state.player.money = 2000;
        this.state.player.debt = 5000;
        break;
      case 'standard':
      default:
        // 默认值已经设置好
        break;
    }
  }

  /**
   * 进入下一周
   * @returns {boolean} 是否成功进入下一周
   */
  advanceWeek() {
    if (this.state.gameOver) return false;
    if (this.state.currentWeek <= this.state.maxWeeks) {
      // 周数+1
      this.state.currentWeek++;
      // 更新债务（每周增加0.5%的利息）
      if (this.state.player.debt > 0) {
        const interest = Math.floor(this.state.player.debt * 0.005);
        this.state.player.debt += interest;
      }

      // 更新事件系统
      this.eventSystem.updateActiveEvents();

      // 更新商品价格
      this.updateProducts();

      // 检查游戏结束条件
      this.checkGameEnd();

      return true;
    } else {
      // 超过最大周数，游戏结束
      this.state.gameOver = true;
      return false;
    }
  }

  /**
   * 切换地点
   * @param {string} locationId 地点ID
   * @returns {boolean} 是否成功切换
   */
  changeLocation(locationId) {
    // 在可用地点中查找
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) return false;

    // 更新当前地点
    this.state.currentLocation = location;

    // 添加到已访问地点
    if (!this.state.player.statistics.visitedLocations.includes(locationId)) {
      this.state.player.statistics.visitedLocations.push(locationId);
    }

    // 更新该地点的商品
    this.updateProducts();

    // 检查是否触发事件
    this.checkForEvents();

    return true;
  }

  /**
   * 更新当前地点的商品
   */
  updateProducts() {
    if (!this.state.currentLocation) return;

    // 获取市场修正因子
    const marketModifiers = this.eventSystem.getActiveMarketModifiers();

    // 生成当前地点可用商品及价格
    this.state.marketProducts = generateLocationProducts(
      this.products,
      this.state.currentLocation,
      this.state.currentWeek,
      marketModifiers
    );
  }

  /**
   * 检查是否触发事件
   */
  checkForEvents() {
    // 只有在游戏进行中才检查事件
    if (!this.state.gameStarted || this.state.gamePaused || this.state.gameOver) {
      return;
    }

    // 检查是否应触发事件
    const event = this.eventSystem.checkForEvents(this.state);
    if (event) {
      this.state.activeEvent = event;
    }
  }

  /**
   * 处理事件选择
   * @param {number} optionIndex 选择的选项索引
   */
  handleEventOption(optionIndex) {
    if (!this.state.activeEvent) return;

    // 获取选中的选项
    const option = this.state.activeEvent.options[optionIndex];
    if (!option) return;

    // 执行选项效果
    const effects = option.action();
    if (effects) {
      // 应用效果到游戏状态
      const updatedState = this.eventSystem.applyEventEffects(this.state, effects);
      Object.assign(this.state, updatedState);
    }

    // 清除当前事件
    this.state.activeEvent = null;

    // 如果需要强制切换地点，提示用户
    if (this.state.forceLocationChange) {
      // 在实际实现中，可能需要通知UI层
      // 这里简单地重置标志
      this.state.forceLocationChange = false;
    }

    // 更新商品价格（反映事件效果）
    this.updateProducts();
  }

  /**
   * 购买商品
   * @param {number} productId 商品ID
   * @param {number} quantity 数量
   * @returns {Object} 交易结果
   */
  buyProduct(productId, quantity) {
    // 找到商品
    const product = this.state.marketProducts.find(p => p.id === productId);
    if (!product) return { success: false, message: '商品不存在' };

    // 计算总价
    const totalPrice = product.currentPrice * quantity;

    // 检查资金是否足够
    if (this.state.player.money < totalPrice) {
      return { success: false, message: '资金不足' };
    }

    // 检查背包容量是否足够
    const currentCapacity = this.state.player.inventory.reduce(
      (sum, item) => sum + item.quantity, 0
    );
    if (currentCapacity + quantity > this.state.player.capacity) {
      return { success: false, message: '背包已满' };
    }

    // 扣减资金
    this.state.player.money -= totalPrice;

    // 添加到背包
    const existingProductIndex = this.state.player.inventory.findIndex(
      item => item.productId === productId
    );

    if (existingProductIndex !== -1) {
      // 已有该商品，更新数量和平均购买价
      const existingProduct = this.state.player.inventory[existingProductIndex];
      const newTotalQuantity = existingProduct.quantity + quantity;
      const newTotalCost = existingProduct.totalCost + totalPrice;
      const newAveragePrice = Math.floor(newTotalCost / newTotalQuantity);

      this.state.player.inventory[existingProductIndex] = {
        ...existingProduct,
        quantity: newTotalQuantity,
        purchasePrice: newAveragePrice,
        totalCost: newTotalCost
      };
    } else {
      // 新商品，添加到背包
      this.state.player.inventory.push(
        createPlayerProduct(product, quantity, product.currentPrice)
      );
    }

    // 更新交易统计
    this.state.player.statistics.transactionCount++;

    return {
      success: true,
      message: `成功购买${quantity}个${product.name}，花费${totalPrice}元`
    };
  }

  /**
   * 出售商品
   * @param {number} inventoryIndex 背包中的商品索引
   * @param {number} quantity 数量
   * @returns {Object} 交易结果
   */
  sellProduct(inventoryIndex, quantity) {
    // 检查索引是否有效
    if (inventoryIndex < 0 || inventoryIndex >= this.state.player.inventory.length) {
      return { success: false, message: '商品不存在' };
    }

    // 获取要出售的商品
    const inventoryItem = this.state.player.inventory[inventoryIndex];

    // 检查数量是否足够
    if (inventoryItem.quantity < quantity) {
      return { success: false, message: '商品数量不足' };
    }

    // 查找当前市场中的对应商品价格
    const marketProduct = this.state.marketProducts.find(
      p => p.id === inventoryItem.productId
    );

    if (!marketProduct) {
      return { success: false, message: '当前地点不收购该商品' };
    }

    // 计算交易金额
    const sellPrice = marketProduct.currentPrice * quantity;

    // 计算利润
    const profit = sellPrice - (inventoryItem.purchasePrice * quantity);

    // 增加资金
    this.state.player.money += sellPrice;

    // 更新背包
    if (inventoryItem.quantity === quantity) {
      // 全部出售，从背包中移除
      this.state.player.inventory.splice(inventoryIndex, 1);
    } else {
      // 部分出售，更新数量
      this.state.player.inventory[inventoryIndex] = {
        ...inventoryItem,
        quantity: inventoryItem.quantity - quantity,
        totalCost: inventoryItem.totalCost - (inventoryItem.purchasePrice * quantity)
      };
    }

    // 更新交易统计
    this.state.player.statistics.transactionCount++;
    this.state.player.statistics.totalProfit += profit;

    // 更新历史最高资金记录
    if (this.state.player.money > this.state.player.statistics.maxMoney) {
      this.state.player.statistics.maxMoney = this.state.player.money;
    }

    return {
      success: true,
      message: `成功出售${quantity}个${inventoryItem.name}，获得${sellPrice}元${profit > 0 ? '（利润' + profit + '元）' : ''}`
    };
  }

  /**
   * 购买房屋
   * @param {string} houseId 房屋ID
   * @returns {Object} 购买结果
   */
  buyHouse(houseId) {
    // 检查是否已经购买过房屋
    const alreadyPurchased = this.state.player.purchasedHouses.some(h => h.houseId === houseId);
    if (alreadyPurchased) {
      return { success: false, message: '已拥有该房屋' };
    }

    // 找到要购买的房屋
    const house = this.houses.find(h => h.id === houseId);
    if (!house) {
      return { success: false, message: '房屋不存在' };
    }

    // 检查资金是否足够
    if (this.state.player.money < house.price) {
      return { success: false, message: '资金不足' };
    }

    // 扣减资金
    this.state.player.money -= house.price;

    // 添加到已购房产
    this.state.player.purchasedHouses.push({
      houseId: house.id,
      name: house.name,
      purchaseWeek: this.state.currentWeek,
      purchasePrice: house.price
    });

    // 检查游戏结束条件
    this.checkGameEnd();

    return {
      success: true,
      message: `恭喜您成功购买${house.name}！`
    };
  }

  /**
   * 还款
   * @param {number} amount 还款金额
   * @returns {Object} 还款结果
   */
  repayDebt(amount) {
    // 检查金额是否有效
    if (amount <= 0) {
      return { success: false, message: '还款金额必须大于0' };
    }

    // 检查债务是否已还清
    if (this.state.player.debt <= 0) {
      return { success: false, message: '您没有债务需要偿还' };
    }

    // 检查资金是否足够
    if (this.state.player.money < amount) {
      return { success: false, message: '资金不足' };
    }

    // 计算实际还款金额（不能超过当前债务）
    const actualAmount = Math.min(amount, this.state.player.debt);

    // 扣减资金
    this.state.player.money -= actualAmount;

    // 减少债务
    this.state.player.debt -= actualAmount;

    return {
      success: true,
      message: `成功偿还债务${actualAmount}元${this.state.player.debt === 0 ? '，您已还清所有债务！' : ''}`
    };
  }

  /**
   * 检查游戏结束条件
   */
  checkGameEnd() {
    // 检查是否超过最大周数
    if (this.state.currentWeek > this.state.maxWeeks) {
      this.state.gameOver = true;
      return;
    }

    // 检查是否购买了特定房屋（可选的胜利条件）
    // 如果购买了最高级别房屋，可以提前结束游戏
    const hasMansion = this.state.player.purchasedHouses.some(h => h.houseId === 'mansion');
    if (hasMansion) {
      // 这里可以设置一个提前胜利标志，而不是直接结束游戏
      // this.state.earlyVictory = true;
    }
  }

  /**
   * 保存游戏状态
   * @returns {Object} 要保存的游戏状态
   */
  getSaveState() {
    return {
      version: __APP_VERSION__,
      timestamp: Date.now(),
      playerName: this.state.player.name,
      currentWeek: this.state.currentWeek,
      gameState: {
        player: this.state.player,
        currentLocation: this.state.currentLocation,
        gameStarted: this.state.gameStarted,
        gamePaused: this.state.gamePaused,
        gameOver: this.state.gameOver
      }
    };
  }

  /**
   * 加载游戏状态
   * @param {Object} saveState - 要加载的游戏状态
   * @returns {boolean} 是否成功加载
   */
  loadSaveState(saveState) {
    try {
      if (!saveState || !saveState.gameState || !saveState.gameState.player) {
        return false;
      }

      // 恢复基本状态
      this.state.currentWeek = saveState.currentWeek;
      this.state.player = saveState.gameState.player;
      this.state.currentLocation = saveState.gameState.currentLocation;
      this.state.gameStarted = saveState.gameState.gameStarted;
      this.state.gamePaused = saveState.gameState.gamePaused;
      this.state.gameOver = saveState.gameState.gameOver;

      // 更新商品价格
      this.updateProducts();

      return true;
    } catch (error) {
      handleError(error, 'gameLoopService (services)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      console.error('Error loading save state:', error);
      return false;
    }
  }
}
