/**
 * 游戏循环服务 - TypeScript版本
 * 管理游戏核心逻辑和状态
 */

import { 
  getAllProducts, 
  getAllLocations, 
  getAllHouses, 
  getAllEvents, 
  createPlayer, 
  createPlayerProduct,
  type Product,
  type Location,
  type House,
  type Event,
  type Player,
  type HouseId,
  type LocationId,
  type ProductId,
  type GameState as ModelGameState,
  type PlayerState,
  type InventoryItem,
  type PurchasedHouse
} from '../models';

import { EventSystem } from './eventSystem';
import { generateLocationProducts } from './priceSystem';
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';

// ==================== 类型定义 ====================

/**
 * 游戏难度级别
 */
export enum GameDifficulty {
  EASY = 'easy',
  NORMAL = 'normal', 
  HARD = 'hard',
  STANDARD = 'standard'
}

/**
 * 游戏状态接口
 */
export interface GameState {
  currentWeek: number;
  maxWeeks: number;
  gameStarted: boolean;
  gamePaused: boolean;
  gameOver: boolean;
  player: Player | null;
  currentLocation: Location | null;
  marketProducts: Array<{
    id: ProductId;
    price: number;
    basePrice: number;
    trend: number;
    available: boolean;
  }>;
  activeEvent: Event | null;
  saveTimestamp: number | null;
}

/**
 * 交易结果接口
 */
export interface TradeResult {
  success: boolean;
  message: string;
  quantity?: number;
  totalPrice?: number;
}

/**
 * 房屋购买结果接口
 */
export interface HousePurchaseResult {
  success: boolean;
  message: string;
  house?: House;
}

/**
 * 存档状态接口
 */
export interface SaveState {
  version: string;
  timestamp: number;
  playerName: string;
  currentWeek: number;
  gameState: {
    player: Player;
    currentLocation: Location;
    gameStarted: boolean;
    gamePaused: boolean;
    gameOver: boolean;
  };
}

// ==================== 工具函数 ====================

/**
 * 初始化游戏数据
 * 返回基础游戏数据对象
 */
export function initializeGame(): {
  products: Product[];
  locations: Location[];
  houses: House[];
  events: Event[];
} {
  return {
    products: getAllProducts(),
    locations: getAllLocations(),
    houses: getAllHouses(),
    events: getAllEvents()
  };
}

/**
 * 获取随机事件
 * @param gameState 游戏状态
 * @returns 事件对象或null
 */
export function getRandomEvent(gameState: ModelGameState): Event | null {
  const eventSystem = new EventSystem(getAllEvents());
  return eventSystem.checkForEvents(gameState);
}

// ==================== 游戏引擎类 ====================

/**
 * 游戏引擎
 * 管理游戏核心逻辑和状态
 */
export class GameEngine {
  private products: Product[];
  private locations: Location[];
  private houses: House[];
  private eventSystem: EventSystem;
  
  public state: GameState;

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
   * @param playerName 玩家名称
   * @param difficulty 游戏难度
   */
  newGame(playerName: string, difficulty: GameDifficulty = GameDifficulty.STANDARD): GameState {
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
   * @param difficulty 难度级别
   */
  private applyDifficulty(difficulty: GameDifficulty): void {
    if (!this.state.player) return;

    switch (difficulty) {
      case GameDifficulty.EASY:
        this.state.player.money = 5000;
        this.state.player.debt = 2000;
        break;
      case GameDifficulty.HARD:
        this.state.player.money = 2000;
        this.state.player.debt = 5000;
        break;
      case GameDifficulty.STANDARD:
      case GameDifficulty.NORMAL:
      default:
        // 默认值已经设置好
        break;
    }
  }

  /**
   * 进入下一周
   * @returns 是否成功进入下一周
   */
  advanceWeek(): boolean {
    if (this.state.gameOver || !this.state.player) return false;
    
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
   * @param locationId 地点ID
   * @returns 是否成功切换
   */
  changeLocation(locationId: LocationId): boolean {
    // 在可用地点中查找
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) return false;

    // 更新当前地点
    this.state.currentLocation = location;

    // 生成当前地点的商品
    this.generateMarketProducts();

    return true;
  }

  /**
   * 生成市场商品
   */
  private generateMarketProducts(): void {
    if (!this.state.currentLocation) return;

    try {
      this.state.marketProducts = generateLocationProducts(
        this.state.currentLocation.id,
        this.state.currentWeek
      );
    } catch (error) {
      handleError(error, 'gameLoopService.generateMarketProducts', ErrorType.MARKET_ERROR, ErrorSeverity.WARNING);
      console.warn('Error generating market products:', error);
      this.state.marketProducts = [];
    }
  }

  /**
   * 更新商品价格
   */
  private updateProducts(): void {
    if (!this.state.currentLocation) return;

    try {
      // 重新生成当前地点的商品价格
      this.state.marketProducts = generateLocationProducts(
        this.state.currentLocation.id,
        this.state.currentWeek
      );
    } catch (error) {
      handleError(error, 'gameLoopService.updateProducts', ErrorType.MARKET_ERROR, ErrorSeverity.WARNING);
      console.warn('Error updating products:', error);
    }
  }

  /**
   * 购买商品
   * @param productId 商品ID
   * @param quantity 购买数量
   * @returns 交易结果
   */
  buyProduct(productId: ProductId, quantity: number): TradeResult {
    if (!this.state.player) {
      return { success: false, message: '玩家未初始化' };
    }

    // 检查商品是否存在
    const marketProduct = this.state.marketProducts.find(p => p.id === productId);
    if (!marketProduct || !marketProduct.available) {
      return { success: false, message: '商品不存在或不可购买' };
    }

    // 检查购买数量
    if (quantity <= 0) {
      return { success: false, message: '购买数量必须大于0' };
    }

    // 计算总价
    const totalPrice = marketProduct.price * quantity;

    // 检查资金是否足够
    if (this.state.player.money < totalPrice) {
      return { success: false, message: '资金不足' };
    }

    // 检查容量是否足够
    const currentWeight = this.state.player.inventory.reduce((sum, item) => sum + item.quantity, 0);
    if (currentWeight + quantity > this.state.player.capacity) {
      return { success: false, message: '容量不足' };
    }

    // 执行购买
    this.state.player.money -= totalPrice;

    // 添加到库存
    const existingItem = this.state.player.inventory.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.totalPrice += totalPrice;
      existingItem.averagePrice = existingItem.totalPrice / existingItem.quantity;
    } else {
      this.state.player.inventory.push(createPlayerProduct(productId, quantity, marketProduct.price));
    }

    return {
      success: true,
      message: `成功购买${quantity}个商品`,
      quantity,
      totalPrice
    };
  }

  /**
   * 出售商品
   * @param productId 商品ID
   * @param quantity 出售数量
   * @returns 交易结果
   */
  sellProduct(productId: ProductId, quantity: number): TradeResult {
    if (!this.state.player) {
      return { success: false, message: '玩家未初始化' };
    }

    // 检查库存中是否有该商品
    const inventoryItem = this.state.player.inventory.find(item => item.productId === productId);
    if (!inventoryItem) {
      return { success: false, message: '库存中没有该商品' };
    }

    // 检查出售数量
    if (quantity <= 0 || quantity > inventoryItem.quantity) {
      return { success: false, message: '出售数量无效' };
    }

    // 检查市场是否有该商品
    const marketProduct = this.state.marketProducts.find(p => p.id === productId);
    if (!marketProduct) {
      return { success: false, message: '当前地点不收购该商品' };
    }

    // 计算总价
    const totalPrice = marketProduct.price * quantity;

    // 执行出售
    this.state.player.money += totalPrice;

    // 更新库存
    inventoryItem.quantity -= quantity;
    if (inventoryItem.quantity === 0) {
      const index = this.state.player.inventory.indexOf(inventoryItem);
      this.state.player.inventory.splice(index, 1);
    } else {
      // 重新计算平均价格
      const remainingValue = inventoryItem.totalPrice - (inventoryItem.averagePrice * quantity);
      inventoryItem.totalPrice = remainingValue;
      inventoryItem.averagePrice = remainingValue / inventoryItem.quantity;
    }

    return {
      success: true,
      message: `成功出售${quantity}个商品`,
      quantity,
      totalPrice
    };
  }

  /**
   * 购买房屋
   * @param houseId 房屋ID
   * @returns 房屋购买结果
   */
  buyHouse(houseId: HouseId): HousePurchaseResult {
    if (!this.state.player) {
      return { success: false, message: '玩家未初始化' };
    }

    // 检查房屋是否存在
    const house = this.houses.find(h => h.id === houseId);
    if (!house) {
      return { success: false, message: '房屋不存在' };
    }

    // 检查是否已经购买过
    const alreadyOwned = this.state.player.purchasedHouses.some(h => h.houseId === houseId);
    if (alreadyOwned) {
      return { success: false, message: '您已经拥有这个房屋' };
    }

    // 检查资金是否足够
    if (this.state.player.money < house.price) {
      return { success: false, message: '资金不足' };
    }

    // 执行购买
    this.state.player.money -= house.price;

    // 添加到已购买房屋列表
    const purchasedHouse: PurchasedHouse = {
      houseId: house.id,
      purchasePrice: house.price,
      purchaseWeek: this.state.currentWeek
    };
    this.state.player.purchasedHouses.push(purchasedHouse);

    return {
      success: true,
      message: `恭喜您成功购买${house.name}！`,
      house
    };
  }

  /**
   * 还款
   * @param amount 还款金额
   * @returns 还款结果
   */
  repayDebt(amount: number): TradeResult {
    if (!this.state.player) {
      return { success: false, message: '玩家未初始化' };
    }

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
      message: `成功偿还债务${actualAmount}元${this.state.player.debt === 0 ? '，您已还清所有债务！' : ''}`,
      totalPrice: actualAmount
    };
  }

  /**
   * 检查游戏结束条件
   */
  private checkGameEnd(): void {
    if (!this.state.player) return;

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
   * @returns 要保存的游戏状态
   */
  getSaveState(): SaveState | null {
    if (!this.state.player || !this.state.currentLocation) {
      return null;
    }

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
   * @param saveState - 要加载的游戏状态
   * @returns 是否成功加载
   */
  loadSaveState(saveState: SaveState): boolean {
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
      handleError(error, 'gameLoopService.loadSaveState', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      console.error('Error loading save state:', error);
      return false;
    }
  }
}