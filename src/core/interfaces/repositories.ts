/**
 * 仓储接口定义
 * 这个文件定义了领域仓储的标准接口
 */

// 基础实体接口
interface BaseEntity {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 玩家实体接口
interface Player extends BaseEntity {
  name: string;
  money: number;
  debt: number;
  inventory: Product[];
  currentLocation: string;
  [key: string]: any;
}

// 产品实体接口
interface Product extends BaseEntity {
  name: string;
  category: string;
  basePrice: number;
  description?: string;
  [key: string]: any;
}

// 市场状态接口
interface MarketState {
  currentWeek: number;
  currentLocation: string;
  productPrices: Record<string, PriceData>;
  locations: Location[];
  [key: string]: any;
}

// 价格数据接口
interface PriceData {
  productId: string;
  price: number;
  trend: string;
  changePercent: number;
  week: number;
  location: string;
}

// 地点接口
interface Location extends BaseEntity {
  name: string;
  factor: number;
  description?: string;
  [key: string]: any;
}

/**
 * 基础仓储接口
 * @template T 实体类型
 * @template TId 实体ID类型
 */
export abstract class IRepository<T extends BaseEntity, TId = string> {
  /**
   * 根据ID获取实体
   * @param id 实体ID
   * @returns 实体对象，不存在时返回null
   */
  abstract async getById(id: TId): Promise<T | null>;

  /**
   * 获取所有实体
   * @returns 实体列表
   */
  abstract async getAll(): Promise<T[]>;

  /**
   * 保存实体
   * @param entity 实体对象
   * @returns 保存结果
   */
  abstract async save(entity: T): Promise<void>;

  /**
   * 删除实体
   * @param id 实体ID
   * @returns 是否删除成功
   */
  abstract async delete(id: TId): Promise<boolean>;
}

/**
 * 玩家仓储接口
 */
export abstract class IPlayerRepository extends IRepository<Player> {
  /**
   * 获取当前玩家
   * @returns 玩家实体
   */
  abstract async getPlayer(): Promise<Player>;

  /**
   * 保存玩家状态
   * @param player 玩家实体
   * @returns 保存结果
   */
  abstract async savePlayer(player: Player): Promise<void>;

  /**
   * 重置玩家状态
   * @returns 重置后的玩家实体
   */
  abstract async resetPlayer(): Promise<Player>;
}

/**
 * 产品仓储接口
 */
export abstract class IProductRepository extends IRepository<Product> {
  /**
   * 根据类别获取产品
   * @param category 产品类别
   * @returns 产品列表
   */
  abstract async getProductsByCategory(category: string): Promise<Product[]>;

  /**
   * 获取所有产品类别
   * @returns 类别列表
   */
  abstract async getCategories(): Promise<string[]>;
}

/**
 * 市场仓储接口
 */
export abstract class IMarketRepository extends IRepository<MarketState> {
  /**
   * 获取当前市场状态
   * @returns 市场状态对象
   */
  abstract async getMarketState(): Promise<MarketState>;

  /**
   * 获取当前商品价格
   * @param productId 产品ID
   * @returns 价格对象
   */
  abstract async getCurrentPrice(productId: string): Promise<PriceData | null>;

  /**
   * 获取价格历史
   * @param productId 产品ID
   * @param limit 限制条数
   * @returns 价格历史记录
   */
  abstract async getPriceHistory(productId: string, limit?: number): Promise<PriceData[]>;

  /**
   * 更新价格
   * @param priceData 价格数据
   * @returns 更新结果
   */
  abstract async updatePrices(priceData: Record<string, PriceData>): Promise<void>;

  /**
   * 获取所有地点
   * @returns 地点列表
   */
  abstract async getLocations(): Promise<Location[]>;

  /**
   * 获取地点
   * @param locationId 地点ID
   * @returns 地点对象
   */
  abstract async getLocation(locationId: string): Promise<Location | null>;
}
