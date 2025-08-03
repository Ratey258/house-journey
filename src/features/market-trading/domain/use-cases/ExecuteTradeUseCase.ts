/**
 * 执行交易用例 (Use Case)
 * 市场交易特性的核心业务用例
 */

import { Trade, TradeType, type TradeResult, type MarketConditions } from '../entities/Trade';
import type { Player } from '../../../../entities/player';
import type { Product } from '../../../../entities/product';
import type { Market } from '../../../../entities/market';

// === 用例接口定义 ===

/**
 * 交易请求
 */
export interface TradeRequest {
  playerId: string;
  productId: string;
  marketId: string;
  type: TradeType;
  quantity: number;
  price: number;
}

/**
 * 交易执行结果
 */
export interface TradeExecutionResult {
  success: boolean;
  trade: Trade;
  tradeResult: TradeResult;
  updatedPlayer: Player;
  updatedProduct: Product;
  message: string;
}

/**
 * 仓储接口定义
 */
export interface ITradingRepository {
  saveTrade(trade: Trade): Promise<void>;
  getTradeById(id: string): Promise<Trade | null>;
  getTradesByPlayer(playerId: string): Promise<Trade[]>;
  getTradesByProduct(productId: string): Promise<Trade[]>;
}

export interface IPlayerRepository {
  getPlayer(id: string): Promise<Player | null>;
  savePlayer(player: Player): Promise<void>;
}

export interface IProductRepository {
  getProduct(id: string): Promise<Product | null>;
  saveProduct(product: Product): Promise<void>;
}

export interface IMarketRepository {
  getMarket(id: string): Promise<Market | null>;
  saveMarket(market: Market): Promise<void>;
}

/**
 * 事件发布接口
 */
export interface IEventPublisher {
  publishTradeExecuted(trade: Trade, result: TradeResult): Promise<void>;
  publishTradeFailed(trade: Trade, reason: string): Promise<void>;
}

// === 用例实现 ===

/**
 * 执行交易用例
 * 处理市场交易的完整业务流程
 */
export class ExecuteTradeUseCase {
  constructor(
    private tradingRepository: ITradingRepository,
    private playerRepository: IPlayerRepository,
    private productRepository: IProductRepository,
    private marketRepository: IMarketRepository,
    private eventPublisher: IEventPublisher
  ) {}

  /**
   * 执行交易
   */
  async execute(request: TradeRequest): Promise<TradeExecutionResult> {
    try {
      // 1. 验证和加载实体
      const entities = await this.loadAndValidateEntities(request);
      if (!entities.success) {
        throw new Error(entities.error);
      }

      const { player, product, market } = entities.data!;

      // 2. 创建交易对象
      const marketConditions = this.getCurrentMarketConditions();
      const trade = new Trade({
        playerId: request.playerId,
        productId: request.productId,
        marketId: request.marketId,
        type: request.type,
        quantity: request.quantity,
        requestedPrice: request.price,
        marketConditions
      });

      // 3. 验证交易
      const validation = await this.validateTrade(trade, player, product, market);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // 4. 执行交易
      const tradeResult = await this.performTrade(trade, player, product, market);

      // 5. 保存更新
      await this.saveEntities(trade, player, product, market);

      // 6. 发布事件
      if (tradeResult.success) {
        await this.eventPublisher.publishTradeExecuted(trade, tradeResult);
      } else {
        await this.eventPublisher.publishTradeFailed(trade, tradeResult.message || '交易失败');
      }

      return {
        success: true,
        trade,
        tradeResult,
        updatedPlayer: player,
        updatedProduct: product,
        message: tradeResult.success ? '交易成功' : '交易失败'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '交易执行失败';
      
      // 创建失败的交易记录
      const failedTrade = new Trade({
        playerId: request.playerId,
        productId: request.productId,
        marketId: request.marketId,
        type: request.type,
        quantity: request.quantity,
        requestedPrice: request.price,
        marketConditions: this.getCurrentMarketConditions()
      });
      
      failedTrade.cancel(errorMessage);
      await this.tradingRepository.saveTrade(failedTrade);

      return {
        success: false,
        trade: failedTrade,
        tradeResult: {
          success: false,
          tradeId: failedTrade.id,
          executedAt: new Date(),
          actualPrice: 0,
          actualQuantity: 0,
          totalAmount: 0,
          commission: 0,
          netAmount: 0,
          message: errorMessage
        },
        updatedPlayer: (await this.playerRepository.getPlayer(request.playerId))!,
        updatedProduct: (await this.productRepository.getProduct(request.productId))!,
        message: errorMessage
      };
    }
  }

  /**
   * 加载和验证实体
   */
  private async loadAndValidateEntities(request: TradeRequest): Promise<{
    success: boolean;
    data?: { player: Player; product: Product; market: Market };
    error?: string;
  }> {
    // 并行加载所有实体
    const [player, product, market] = await Promise.all([
      this.playerRepository.getPlayer(request.playerId),
      this.productRepository.getProduct(request.productId),
      this.marketRepository.getMarket(request.marketId)
    ]);

    // 验证实体存在性
    if (!player) {
      return { success: false, error: '玩家不存在' };
    }

    if (!product) {
      return { success: false, error: '商品不存在' };
    }

    if (!market) {
      return { success: false, error: '市场不存在' };
    }

    // 验证市场状态
    if (!market.canTrade()) {
      return { success: false, error: '市场当前不开放交易' };
    }

    // 验证商品在市场中可用
    if (!market.supportsProduct(request.productId)) {
      return { success: false, error: '该商品不在此市场交易' };
    }

    return {
      success: true,
      data: { player, product, market }
    };
  }

  /**
   * 验证交易
   */
  private async validateTrade(
    trade: Trade,
    player: Player,
    product: Product,
    market: Market
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 使用交易实体的验证方法
    const basicValidation = Trade.validateTradeRequest(
      trade.type,
      trade.quantity,
      trade.requestedPrice,
      player.money,
      product.availability.quantity,
      market.minOrderValue,
      market.maxOrderValue
    );

    if (!basicValidation.isValid) {
      errors.push(...basicValidation.errors);
    }

    // 买入交易特定验证
    if (trade.isBuyTrade()) {
      // 验证库存
      if (!product.canPurchase(trade.quantity)) {
        errors.push('商品库存不足');
      }

      // 验证资金（包括手续费）
      const totalCost = trade.calculateExpectedCost(market.commissionRate);
      if (totalCost > player.money) {
        errors.push('资金不足（包含手续费）');
      }

      // 验证库存空间
      const requiredSpace = product.size * trade.quantity;
      if (requiredSpace > player.getRemainingInventorySpace()) {
        errors.push('背包空间不足');
      }
    }

    // 卖出交易特定验证
    if (trade.isSellTrade()) {
      // 验证玩家持有数量
      const inventoryItem = player.inventory.find(item => item.productId === trade.productId);
      if (!inventoryItem || inventoryItem.quantity < trade.quantity) {
        errors.push('持有数量不足');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 执行交易
   */
  private async performTrade(
    trade: Trade,
    player: Player,
    product: Product,
    market: Market
  ): Promise<TradeResult> {
    // 计算实际价格（考虑市场波动）
    const actualPrice = this.calculateActualPrice(product, trade.requestedPrice);
    const actualQuantity = trade.quantity; // 简化处理，实际数量等于请求数量

    // 执行交易
    const tradeResult = trade.execute(actualPrice, actualQuantity, market.commissionRate);

    if (!tradeResult.success) {
      return tradeResult;
    }

    // 更新玩家状态
    if (trade.isBuyTrade()) {
      // 买入：扣除资金，增加库存
      player.spendMoney(tradeResult.netAmount);
      player.addToInventory(
        trade.productId,
        product.name,
        actualQuantity,
        actualPrice,
        product.size
      );
    } else {
      // 卖出：增加资金，减少库存
      player.addMoney(tradeResult.netAmount);
      player.removeFromInventory(trade.productId, actualQuantity);
      
      // 计算利润
      const inventoryItem = player.inventory.find(item => item.productId === trade.productId);
      if (inventoryItem) {
        const profit = trade.calculateProfit(inventoryItem.purchasePrice);
        player.recordTransaction(profit);
      }
    }

    // 更新产品状态
    if (trade.isBuyTrade()) {
      product.decreaseStock(actualQuantity);
    } else {
      product.increaseStock(actualQuantity);
    }

    // 更新价格（简单的供需模型）
    const priceImpact = this.calculatePriceImpact(trade, product);
    const newPrice = actualPrice * (1 + priceImpact);
    product.updatePrice(newPrice, actualQuantity);

    // 记录市场交易
    market.recordTransaction(trade.productId, actualQuantity, actualPrice);

    return tradeResult;
  }

  /**
   * 计算实际价格
   */
  private calculateActualPrice(product: Product, requestedPrice: number): number {
    // 简化的价格计算：在请求价格基础上加入市场波动
    const currentPrice = product.getCurrentPrice();
    const volatility = product.marketData.volatility / 100;
    const randomFactor = (Math.random() - 0.5) * 2 * volatility; // -volatility 到 +volatility
    
    const actualPrice = currentPrice * (1 + randomFactor);
    
    // 确保价格在有效范围内
    return product.adjustPriceToRange(actualPrice);
  }

  /**
   * 计算价格影响
   */
  private calculatePriceImpact(trade: Trade, product: Product): number {
    // 简单的价格影响模型
    const tradeVolume = trade.quantity * (trade.actualPrice || trade.requestedPrice);
    const productVolume = product.marketData.volume24h || 1;
    const volumeRatio = tradeVolume / productVolume;
    
    // 买入推高价格，卖出压低价格
    const direction = trade.isBuyTrade() ? 1 : -1;
    
    // 影响幅度与交易量占比和产品波动性相关
    const impact = direction * volumeRatio * (product.marketData.volatility / 100) * 0.1;
    
    // 限制影响范围在 -5% 到 +5%
    return Math.max(-0.05, Math.min(0.05, impact));
  }

  /**
   * 获取当前市场条件
   */
  private getCurrentMarketConditions(): MarketConditions {
    // 简化实现，实际应该从市场数据服务获取
    return {
      currentWeek: 1,
      season: 'spring',
      marketTrend: 'sideways',
      volatilityIndex: 20,
      liquidityIndex: 50,
      demandIndex: 50,
      supplyIndex: 50
    };
  }

  /**
   * 保存所有实体
   */
  private async saveEntities(
    trade: Trade,
    player: Player,
    product: Product,
    market: Market
  ): Promise<void> {
    // 并行保存所有实体
    await Promise.all([
      this.tradingRepository.saveTrade(trade),
      this.playerRepository.savePlayer(player),
      this.productRepository.saveProduct(product),
      this.marketRepository.saveMarket(market)
    ]);
  }
}