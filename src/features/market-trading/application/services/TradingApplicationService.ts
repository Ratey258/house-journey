/**
 * 交易应用服务
 * 编排市场交易相关的用例，提供高级业务功能
 */

import { 
  ExecuteTradeUseCase, 
  type TradeRequest, 
  type TradeExecutionResult,
  type ITradingRepository,
  type IPlayerRepository,
  type IProductRepository,
  type IMarketRepository,
  type IEventPublisher
} from '../domain/use-cases/ExecuteTradeUseCase';

import { 
  CalculatePriceUseCase,
  type PriceCalculationRequest,
  type PriceCalculationResult,
  type PriceForecast,
  type MarketAnalysis
} from '../domain/use-cases/CalculatePriceUseCase';

import { TradeType } from '../domain/entities/Trade';
import type { TradeValidation } from '../domain/entities/Trade';

// === 应用服务接口定义 ===

/**
 * 交易详情请求
 */
export interface TradeDetailRequest {
  productId: string;
  marketId: string;
  playerId: string;
  type: TradeType;
  quantity: number;
  requestedPrice?: number; // 可选，用于预估
}

/**
 * 交易详情响应
 */
export interface TradeDetailResponse {
  productInfo: {
    id: string;
    name: string;
    currentPrice: number;
    availableQuantity: number;
    priceRange: { min: number; max: number };
  };
  marketInfo: {
    id: string;
    name: string;
    status: string;
    commissionRate: number;
    minOrderValue: number;
    maxOrderValue: number;
  };
  playerInfo: {
    money: number;
    inventorySpace: number;
    ownedQuantity: number;
  };
  priceAnalysis: PriceCalculationResult;
  validation: TradeValidation;
  estimatedCost: number;
  estimatedRevenue: number;
}

/**
 * 市场概览响应
 */
export interface MarketOverviewResponse {
  markets: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    totalVolume: number;
    activeProducts: number;
    trend: string;
  }>;
  analysis: MarketAnalysis;
  hotProducts: Array<{
    productId: string;
    name: string;
    priceChange: number;
    volume: number;
    recommendation: string;
  }>;
}

/**
 * 交易历史请求
 */
export interface TradeHistoryRequest {
  playerId: string;
  productId?: string;
  marketId?: string;
  type?: TradeType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * 交易历史响应
 */
export interface TradeHistoryResponse {
  trades: Array<{
    id: string;
    type: TradeType;
    productName: string;
    quantity: number;
    price: number;
    totalAmount: number;
    profit?: number;
    executedAt: Date;
    status: string;
  }>;
  summary: {
    totalTrades: number;
    totalProfit: number;
    successRate: number;
    favoriteProduct: string;
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// === 应用服务实现 ===

/**
 * 交易应用服务
 * 提供完整的交易相关业务功能
 */
export class TradingApplicationService {
  private executeTradeUseCase: ExecuteTradeUseCase;
  private calculatePriceUseCase: CalculatePriceUseCase;

  constructor(
    tradingRepository: ITradingRepository,
    playerRepository: IPlayerRepository,
    productRepository: IProductRepository,
    marketRepository: IMarketRepository,
    eventPublisher: IEventPublisher
  ) {
    this.executeTradeUseCase = new ExecuteTradeUseCase(
      tradingRepository,
      playerRepository,
      productRepository,
      marketRepository,
      eventPublisher
    );

    this.calculatePriceUseCase = new CalculatePriceUseCase(
      productRepository,
      marketRepository
    );
  }

  /**
   * 执行交易
   */
  async executeTrade(request: TradeRequest): Promise<TradeExecutionResult> {
    // 直接调用用例
    return await this.executeTradeUseCase.execute(request);
  }

  /**
   * 获取交易详情和分析
   */
  async getTradeDetails(request: TradeDetailRequest): Promise<TradeDetailResponse> {
    // 并行获取所有需要的数据
    const [product, market, player] = await Promise.all([
      this.productRepository.getProduct(request.productId),
      this.marketRepository.getMarket(request.marketId),
      this.playerRepository.getPlayer(request.playerId)
    ]);

    if (!product || !market || !player) {
      throw new Error('无法获取必要的数据');
    }

    // 计算价格分析
    const priceRequest: PriceCalculationRequest = {
      productId: request.productId,
      marketId: request.marketId,
      week: 1 // 简化处理
    };

    const priceAnalysis = await this.calculatePriceUseCase.calculateCurrentPrice(priceRequest);

    // 验证交易
    const validation = Trade.validateTradeRequest(
      request.type,
      request.quantity,
      request.requestedPrice || product.getCurrentPrice(),
      player.money,
      product.availability.quantity,
      market.minOrderValue,
      market.maxOrderValue
    );

    // 计算预估成本和收益
    const price = request.requestedPrice || priceAnalysis.adjustedPrice;
    const estimatedCost = request.type === TradeType.BUY ? 
      (price * request.quantity) * (1 + market.commissionRate) : 0;
    const estimatedRevenue = request.type === TradeType.SELL ? 
      (price * request.quantity) * (1 - market.commissionRate) : 0;

    // 获取玩家持有数量
    const inventoryItem = player.inventory.find(item => item.productId === request.productId);
    const ownedQuantity = inventoryItem ? inventoryItem.quantity : 0;

    return {
      productInfo: {
        id: product.id,
        name: product.name,
        currentPrice: product.getCurrentPrice(),
        availableQuantity: product.availability.quantity,
        priceRange: { 
          min: product.priceRange.min, 
          max: product.priceRange.max 
        }
      },
      marketInfo: {
        id: market.id,
        name: market.name,
        status: market.status,
        commissionRate: market.commissionRate,
        minOrderValue: market.minOrderValue,
        maxOrderValue: market.maxOrderValue
      },
      playerInfo: {
        money: player.money,
        inventorySpace: player.getRemainingInventorySpace(),
        ownedQuantity
      },
      priceAnalysis,
      validation,
      estimatedCost,
      estimatedRevenue
    };
  }

  /**
   * 获取价格预测
   */
  async getPriceForecast(
    productId: string, 
    marketId: string, 
    weeks: number = 4
  ): Promise<PriceForecast> {
    return await this.calculatePriceUseCase.generatePriceForecast(productId, marketId, weeks);
  }

  /**
   * 获取市场概览
   */
  async getMarketOverview(marketIds?: string[]): Promise<MarketOverviewResponse> {
    // 如果没有指定市场，获取所有市场
    const markets = [];
    
    if (marketIds) {
      for (const marketId of marketIds) {
        const market = await this.marketRepository.getMarket(marketId);
        if (market) {
          markets.push(market);
        }
      }
    } else {
      // 获取预定义的主要市场
      const mainMarketIds = ['commodity_market', 'electronics_hub', 'luxury_mall', 'collectors_market'];
      for (const marketId of mainMarketIds) {
        const market = await this.marketRepository.getMarket(marketId);
        if (market) {
          markets.push(market);
        }
      }
    }

    // 获取第一个市场的分析（作为整体市场分析）
    const analysis = markets.length > 0 ? 
      await this.calculatePriceUseCase.generateMarketAnalysis(markets[0].id) :
      {
        overallTrend: 'sideways' as const,
        volatilityLevel: 'medium' as const,
        liquidityLevel: 'medium' as const,
        recommendedActions: []
      };

    // 构建市场概览
    const marketOverviews = markets.map(market => {
      const overview = market.getOverview();
      return {
        id: overview.name,
        name: overview.name,
        type: overview.type,
        status: overview.status,
        totalVolume: overview.volume,
        activeProducts: overview.activeProducts,
        trend: overview.trend
      };
    });

    // 生成热门商品列表
    const hotProducts = [];
    for (const market of markets) {
      for (const productId of Array.from(market.supportedProducts).slice(0, 3)) {
        const product = await this.productRepository.getProduct(productId);
        if (product) {
          const priceAnalysis = await this.calculatePriceUseCase.calculateCurrentPrice({
            productId,
            marketId: market.id,
            week: 1
          });

          hotProducts.push({
            productId,
            name: product.name,
            priceChange: priceAnalysis.priceChangePercent,
            volume: product.marketData.volume24h,
            recommendation: priceAnalysis.recommendation
          });
        }
      }
    }

    // 按价格变化排序，取前10个
    hotProducts.sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange));

    return {
      markets: marketOverviews,
      analysis,
      hotProducts: hotProducts.slice(0, 10)
    };
  }

  /**
   * 获取交易历史
   */
  async getTradeHistory(request: TradeHistoryRequest): Promise<TradeHistoryResponse> {
    // 获取玩家的所有交易
    const allTrades = await this.tradingRepository.getTradesByPlayer(request.playerId);

    // 应用过滤条件
    let filteredTrades = allTrades.filter(trade => {
      if (request.productId && trade.productId !== request.productId) return false;
      if (request.marketId && trade.marketId !== request.marketId) return false;
      if (request.type && trade.type !== request.type) return false;
      if (request.startDate && trade.createdAt < request.startDate) return false;
      if (request.endDate && trade.createdAt > request.endDate) return false;
      return true;
    });

    // 排序（最新的在前）
    filteredTrades.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 分页
    const limit = request.limit || 20;
    const offset = request.offset || 0;
    const paginatedTrades = filteredTrades.slice(offset, offset + limit);

    // 获取产品信息并构建响应
    const tradesWithDetails = await Promise.all(
      paginatedTrades.map(async (trade) => {
        const product = await this.productRepository.getProduct(trade.productId);
        
        return {
          id: trade.id,
          type: trade.type,
          productName: product?.name || '未知商品',
          quantity: trade.actualQuantity || trade.quantity,
          price: trade.actualPrice || trade.requestedPrice,
          totalAmount: trade.totalAmount || 0,
          profit: trade.profit,
          executedAt: trade.executedAt || trade.createdAt,
          status: trade.getStatusDescription()
        };
      })
    );

    // 计算汇总信息
    const executedTrades = filteredTrades.filter(t => t.isExecuted());
    const totalProfit = executedTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
    const successfulTrades = executedTrades.filter(t => (trade.profit || 0) > 0);
    const successRate = executedTrades.length > 0 ? 
      (successfulTrades.length / executedTrades.length) * 100 : 0;

    // 找出最常交易的商品
    const productCounts = new Map<string, number>();
    filteredTrades.forEach(trade => {
      const count = productCounts.get(trade.productId) || 0;
      productCounts.set(trade.productId, count + 1);
    });

    let favoriteProductId = '';
    let maxCount = 0;
    for (const [productId, count] of productCounts) {
      if (count > maxCount) {
        maxCount = count;
        favoriteProductId = productId;
      }
    }

    const favoriteProduct = favoriteProductId ? 
      await this.productRepository.getProduct(favoriteProductId) : null;

    return {
      trades: tradesWithDetails,
      summary: {
        totalTrades: filteredTrades.length,
        totalProfit,
        successRate: Math.round(successRate * 100) / 100,
        favoriteProduct: favoriteProduct?.name || '暂无'
      },
      pagination: {
        total: filteredTrades.length,
        limit,
        offset,
        hasMore: offset + limit < filteredTrades.length
      }
    };
  }

  /**
   * 快速交易（一键买入/卖出）
   */
  async quickTrade(
    playerId: string,
    productId: string,
    marketId: string,
    type: TradeType,
    quantity: number
  ): Promise<TradeExecutionResult> {
    // 获取当前价格
    const priceResult = await this.calculatePriceUseCase.calculateCurrentPrice({
      productId,
      marketId,
      week: 1
    });

    // 使用调整后的价格执行交易
    const tradeRequest: TradeRequest = {
      playerId,
      productId,
      marketId,
      type,
      quantity,
      price: priceResult.adjustedPrice
    };

    return await this.executeTradeUseCase.execute(tradeRequest);
  }

  /**
   * 批量交易
   */
  async batchTrade(requests: TradeRequest[]): Promise<TradeExecutionResult[]> {
    const results: TradeExecutionResult[] = [];

    // 顺序执行每个交易（避免并发问题）
    for (const request of requests) {
      try {
        const result = await this.executeTradeUseCase.execute(request);
        results.push(result);
      } catch (error) {
        // 继续执行后续交易，但记录失败
        results.push({
          success: false,
          trade: null as any,
          tradeResult: {
            success: false,
            tradeId: '',
            executedAt: new Date(),
            actualPrice: 0,
            actualQuantity: 0,
            totalAmount: 0,
            commission: 0,
            netAmount: 0,
            message: error instanceof Error ? error.message : '批量交易失败'
          },
          updatedPlayer: null as any,
          updatedProduct: null as any,
          message: error instanceof Error ? error.message : '批量交易失败'
        });
      }
    }

    return results;
  }


}