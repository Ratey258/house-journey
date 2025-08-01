/**
 * 应用服务接口定义
 * 这个文件定义了应用层服务的标准接口
 */

// 类型定义
interface TradeResult {
  success: boolean;
  message?: string;
  newBalance: number;
  inventory?: Product[];
  [key: string]: any;
}

interface MarketUpdateResult {
  success: boolean;
  updatedPrices: Record<string, number>;
  message?: string;
}

interface LocationProducts {
  locationId: string;
  products: (Product & { currentPrice: number })[];
}

interface GameConfig {
  maxWeeks: number;
  startingMoney: number;
  startingDebt: number;
  startingLocation: string;
  [key: string]: any;
}

interface GameState {
  currentWeek: number;
  player: Player;
  market: MarketState;
  [key: string]: any;
}

interface SaveResult {
  success: boolean;
  saveName: string;
  message?: string;
}

interface LoadResult {
  success: boolean;
  gameState?: GameState;
  message?: string;
}

interface Player {
  id: string;
  name: string;
  money: number;
  debt: number;
  inventory: Product[];
  currentLocation: string;
  [key: string]: any;
}

interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  [key: string]: any;
}

interface MarketState {
  currentWeek: number;
  currentLocation: string;
  productPrices: Record<string, number>;
  [key: string]: any;
}

/**
 * 市场应用服务接口
 * 负责协调市场相关的业务流程
 */
export abstract class IMarketService {
  /**
   * 交易商品
   * @param productId 产品ID
   * @param quantity 数量
   * @param isBuying 是否为购买操作
   * @returns 交易结果
   */
  abstract async tradeProduct(productId: string, quantity: number, isBuying: boolean): Promise<TradeResult>;
    throw new Error('Method not implemented');
  }

  /**
   * 更新市场价格
   * @param weekNumber 周数
   * @returns 更新结果
   */
  abstract async updateMarketPrices(weekNumber: number): Promise<MarketUpdateResult>;
    throw new Error('Method not implemented');
  }

  /**
   * 更新地点商品价格
   * @param locationId 地点ID
   * @param weekNumber 周数
   * @returns 更新后的商品列表
   */
  abstract async updateLocationProducts(locationId: string, weekNumber: number): Promise<LocationProducts>;
    throw new Error('Method not implemented');
  }

  /**
   * 切换地点
   * @param locationId 目标地点ID
   * @param weekNumber 当前周数
   * @returns 切换结果
   */
  abstract async changeLocation(locationId: string, weekNumber: number): Promise<TradeResult>;
    throw new Error('Method not implemented');
  }

  /**
   * 获取市场状态
   * @returns 市场状态
   */
  abstract async getMarketStatus(): Promise<MarketState>;
    throw new Error('Method not implemented');
  }
}

/**
 * 游戏应用服务接口
 * 负责协调游戏主流程
 */
export abstract class IGameService {
  /**
   * 初始化游戏
   * @param config 游戏配置
   * @returns 初始化结果
   */
  abstract async initialize(config: GameConfig): Promise<void>;
    throw new Error('Method not implemented');
  }

  /**
   * 开始新游戏
   * @param config 游戏配置
   * @returns 游戏状态
   */
  abstract async startNewGame(config: GameConfig): Promise<GameState>;
    throw new Error('Method not implemented');
  }

  /**
   * 加载游戏
   * @param saveName 存档名称
   * @returns 加载结果
   */
  abstract async loadGame(saveName: string): Promise<LoadResult>;
    throw new Error('Method not implemented');
  }

  /**
   * 保存游戏
   * @param saveName 存档名称
   * @returns 保存结果
   */
  abstract async saveGame(saveName: string): Promise<SaveResult>;
    throw new Error('Method not implemented');
  }

  /**
   * 处理游戏周期
   * @returns 处理结果
   */
  abstract async processWeek(): Promise<GameState>;
    throw new Error('Method not implemented');
  }

  /**
   * 结束游戏
   * @returns 游戏结果
   */
  abstract async endGame(): Promise<any>;
    throw new Error('Method not implemented');
  }
}

/**
 * 事件应用服务接口
 * 负责协调游戏事件的处理
 */
export abstract class IEventService {
  /**
   * 生成游戏事件
   * @param gameState 游戏状态
   * @returns 生成的事件
   */
  abstract async generateEvent(gameState: GameState): Promise<any>;
    throw new Error('Method not implemented');
  }

  /**
   * 处理事件选择
   * @param eventId 事件ID
   * @param choiceId 选择ID
   * @returns 选择结果
   */
  abstract async handleEventChoice(eventId: string, choiceId: string): Promise<any>;
    throw new Error('Method not implemented');
  }

  /**
   * 关闭事件
   * @param eventId 事件ID
   * @returns 关闭结果
   */
  abstract async closeEvent(eventId: string): Promise<void>;
    throw new Error('Method not implemented');
  }

  /**
   * 获取当前活跃事件
   * @returns 活跃事件
   */
  abstract async getActiveEvent(): Promise<any>;
    throw new Error('Method not implemented');
  }
}
