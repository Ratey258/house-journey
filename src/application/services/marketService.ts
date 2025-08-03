/**
 * 市场服务
 * 处理市场交易、价格更新等业务逻辑
 */
import { withErrorHandling } from '../../infrastructure/utils/errorHandler';
import { ErrorType } from '../../infrastructure/utils/errorTypes';
import { batchUpdatePrices, generateLocationProducts } from '../../core/services/priceSystem';
import { IMarketService } from '../interfaces/services';
import type { 
  IPlayerRepository, 
  IProductRepository, 
  IMarketRepository 
} from '../../core/interfaces/repositories';
import type { 
  TradeResult, 
  MarketUpdateResult, 
  LocationProducts,
  MarketState 
} from '../interfaces/services';

/**
 * 市场服务实现类
 * 实现了IMarketService接口，负责协调市场相关的业务流程
 */
export class MarketService extends IMarketService {
  private playerRepository: IPlayerRepository;
  private productRepository: IProductRepository;
  private marketRepository: IMarketRepository;
  private eventEmitter: any; // TODO: 需要定义IEventEmitter接口

  /**
   * 构造函数
   * @param playerRepository 玩家仓储
   * @param productRepository 产品仓储
   * @param marketRepository 市场仓储
   * @param eventEmitter 事件发射器
   */
  constructor(
    playerRepository: IPlayerRepository, 
    productRepository: IProductRepository, 
    marketRepository: IMarketRepository, 
    eventEmitter: any
  ) {
    super();
    this.playerRepository = playerRepository;
    this.productRepository = productRepository;
    this.marketRepository = marketRepository;
    this.eventEmitter = eventEmitter;
  }
  
  /**
   * 交易商品
   * @param productId 产品ID
   * @param quantity 数量
   * @param isBuying 是否为购买操作
   * @returns 交易结果
   */
  async tradeProduct(productId: string, quantity: number, isBuying: boolean): Promise<TradeResult> {
    return withErrorHandling(async () => {
      const player = await this.playerRepository.getPlayer();
      const product = await this.productRepository.getProductById(productId);
      const currentPrice = await this.marketRepository.getCurrentPrice(productId);
      
      if (!product || !currentPrice) {
        throw new Error('商品不存在或价格未定义');
      }
      
      const totalCost = currentPrice.price * quantity;
      
      if (isBuying) {
        // 购买流程
        if (player.money < totalCost) {
          return { success: false, message: '资金不足' };
        }
        
        const added = player.addToInventory(product, quantity, currentPrice.price);
        if (!added) {
          return { success: false, message: '背包空间不足' };
        }
        
        player.spendMoney(totalCost);
        player.statistics.transactionCount++;
        
        // 触发购买事件
        this.eventEmitter.emit('PRODUCT_PURCHASED', {
          product,
          quantity,
          price: currentPrice.price,
          totalCost
        });
      } else {
        // 销售流程
        const removed = player.removeFromInventory(productId, quantity);
        if (!removed) {
          return { success: false, message: '物品数量不足' };
        }
        
        const revenue = totalCost;
        player.addMoney(revenue);
        
        // 计算利润
        const inventoryItem = player.inventory.find(item => item.productId === productId);
        const costBasis = inventoryItem ? inventoryItem.purchasePrice * quantity : 0;
        const profit = revenue - costBasis;
        
        player.statistics.transactionCount++;
        player.statistics.totalProfit += profit;
        
        // 触发销售事件
        this.eventEmitter.emit('PRODUCT_SOLD', {
          product,
          quantity,
          price: currentPrice.price,
          revenue,
          profit
        });
      }
      
      // 保存玩家状态
      await this.playerRepository.savePlayer(player);
      
      return { success: true };
    }, 'MarketService.tradeProduct', ErrorType.GAME_LOGIC);
  }
  
  /**
   * 更新市场价格
   * @param weekNumber 周数
   * @returns 更新后的价格
   */
  async updateMarketPrices(weekNumber: number): Promise<any> {
    return withErrorHandling(async () => {
      const products = await this.productRepository.getAllProducts();
      const priceHistory = await this.marketRepository.getAllPrices();
      const marketModifiers = await this.marketRepository.getMarketModifiers();
      
      const newPrices = batchUpdatePrices(products, weekNumber, priceHistory, marketModifiers);
      
      // 更新价格数据库
      await this.marketRepository.updatePrices(newPrices);
      
      // 触发市场更新事件
      this.eventEmitter.emit('MARKET_UPDATED', {
        weekNumber,
        priceChanges: Object.entries(newPrices).map(([id, data]) => ({
          productId: id,
          oldPrice: priceHistory[id]?.price,
          newPrice: data.price,
          trend: data.trend
        }))
      });
      
      return newPrices;
    }, 'MarketService.updateMarketPrices', ErrorType.GAME_LOGIC);
  }
  
  /**
   * 更新地点可用产品
   * @param locationId 地点ID
   * @param weekNumber 周数
   * @returns 可用产品列表
   */
  async updateLocationProducts(locationId: string, weekNumber: number): Promise<any[]> {
    return withErrorHandling(async () => {
      const location = await this.marketRepository.getLocationById(locationId);
      if (!location) {
        throw new Error(`地点不存在: ${locationId}`);
      }
      
      const products = await this.productRepository.getAllProducts();
      const priceHistory = await this.marketRepository.getAllPrices();
      const marketModifiers = await this.marketRepository.getMarketModifiers();
      
      const availableProducts = generateLocationProducts(
        products,
        location,
        priceHistory,
        weekNumber,
        marketModifiers
      );
      
      // 更新地点可用产品
      await this.marketRepository.updateLocationProducts(locationId, availableProducts);
      
      return availableProducts;
    }, 'MarketService.updateLocationProducts', ErrorType.GAME_LOGIC);
  }
  
  /**
   * 变更当前地点
   * @param locationId 地点ID
   * @param weekNumber 当前周数
   * @returns 地点信息和可用产品
   */
  async changeLocation(locationId: string, weekNumber: number): Promise<any> {
    return withErrorHandling(async () => {
      const player = await this.playerRepository.getPlayer();
      const location = await this.marketRepository.getLocationById(locationId);
      
      if (!location) {
        throw new Error(`地点不存在: ${locationId}`);
      }
      
      // 记录玩家访问地点
      const isFirstVisit = player.visitLocation(locationId);
      await this.playerRepository.savePlayer(player);
      
      // 获取地点可用产品
      const availableProducts = await this.updateLocationProducts(locationId, weekNumber);
      
      // 更新当前地点
      await this.marketRepository.setCurrentLocation(locationId);
      
      // 触发地点变更事件
      this.eventEmitter.emit('LOCATION_CHANGED', {
        locationId,
        isFirstVisit,
        availableProducts
      });
      
      return {
        location,
        availableProducts,
        isFirstVisit
      };
    }, 'MarketService.changeLocation', ErrorType.GAME_LOGIC);
  }
  
  /**
   * 获取当前市场状态
   * @returns 市场状态
   */
  async getMarketStatus(): Promise<any> {
    return withErrorHandling(async () => {
      const currentLocation = await this.marketRepository.getCurrentLocation();
      const priceHistory = await this.marketRepository.getAllPrices();
      const marketModifiers = await this.marketRepository.getMarketModifiers();
      
      return {
        currentLocation,
        priceHistory,
        marketModifiers
      };
    }, 'MarketService.getMarketStatus', ErrorType.GAME_LOGIC);
  }
}

export default MarketService;