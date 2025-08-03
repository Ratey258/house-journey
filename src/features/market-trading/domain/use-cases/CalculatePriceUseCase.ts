/**
 * 价格计算用例 (Use Case)
 * 处理商品价格计算和预测的业务逻辑
 */

import type { Product } from '../../../../entities/product';
import type { Market, MarketEvent } from '../../../../entities/market';

// === 用例接口定义 ===

/**
 * 价格计算请求
 */
export interface PriceCalculationRequest {
  productId: string;
  marketId: string;
  week: number;
  marketModifiers?: Record<string, number>;
  locationModifiers?: Record<string, number>;
  eventModifiers?: MarketEvent[];
}

/**
 * 价格计算结果
 */
export interface PriceCalculationResult {
  basePrice: number;
  adjustedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  factors: PriceFactor[];
  confidence: number; // 0-100，价格预测的可信度
  recommendation: 'buy' | 'sell' | 'hold';
}

/**
 * 价格影响因子
 */
export interface PriceFactor {
  name: string;
  impact: number; // -1 到 1
  description: string;
  weight: number; // 权重
}

/**
 * 价格预测
 */
export interface PriceForecast {
  productId: string;
  currentPrice: number;
  predictions: Array<{
    week: number;
    predictedPrice: number;
    confidence: number;
    trend: 'rising' | 'falling' | 'stable';
  }>;
  factors: PriceFactor[];
}

/**
 * 市场分析结果
 */
export interface MarketAnalysis {
  overallTrend: 'bull' | 'bear' | 'sideways';
  volatilityLevel: 'low' | 'medium' | 'high' | 'extreme';
  liquidityLevel: 'low' | 'medium' | 'high';
  recommendedActions: Array<{
    action: 'buy' | 'sell' | 'hold';
    productId: string;
    confidence: number;
    reason: string;
  }>;
}

// === 用例实现 ===

/**
 * 价格计算用例
 * 基于多种因素计算商品的实时价格和价格预测
 */
export class CalculatePriceUseCase {
  constructor(
    private productRepository: IProductRepository,
    private marketRepository: IMarketRepository
  ) {}

  /**
   * 计算当前价格
   */
  async calculateCurrentPrice(request: PriceCalculationRequest): Promise<PriceCalculationResult> {
    const product = await this.productRepository.getProduct(request.productId);
    if (!product) {
      throw new Error('商品不存在');
    }

    const market = await this.marketRepository.getMarket(request.marketId);
    if (!market) {
      throw new Error('市场不存在');
    }

    // 获取基础价格
    const basePrice = product.getCurrentPrice();

    // 计算各种影响因子
    const factors = this.calculatePriceFactors(
      product,
      market,
      request.week,
      request.marketModifiers,
      request.locationModifiers,
      request.eventModifiers
    );

    // 应用所有因子计算调整后价格
    const totalImpact = factors.reduce((sum, factor) => sum + factor.impact * factor.weight, 0);
    const adjustedPrice = basePrice * (1 + totalImpact);

    // 确保价格在有效范围内
    const finalPrice = product.adjustPriceToRange(adjustedPrice);

    const priceChange = finalPrice - basePrice;
    const priceChangePercent = (priceChange / basePrice) * 100;

    // 计算预测可信度
    const confidence = this.calculateConfidence(factors, product, market);

    // 生成投资建议
    const recommendation = this.generateRecommendation(priceChangePercent, confidence, factors);

    return {
      basePrice,
      adjustedPrice: finalPrice,
      priceChange,
      priceChangePercent,
      factors,
      confidence,
      recommendation
    };
  }

  /**
   * 生成价格预测
   */
  async generatePriceForecast(
    productId: string,
    marketId: string,
    weeks: number = 4
  ): Promise<PriceForecast> {
    const product = await this.productRepository.getProduct(productId);
    if (!product) {
      throw new Error('商品不存在');
    }

    const market = await this.marketRepository.getMarket(marketId);
    if (!market) {
      throw new Error('市场不存在');
    }

    const currentPrice = product.getCurrentPrice();
    const predictions = [];

    // 计算基础因子（用于预测）
    const baseFactor = this.calculateBaseSeasonalFactor(product);
    const trendFactor = this.calculateTrendFactor(product);
    const volatilityFactor = product.marketData.volatility / 100;

    for (let week = 1; week <= weeks; week++) {
      // 应用时间衰减的随机波动
      const randomFactor = (Math.random() - 0.5) * 2 * volatilityFactor * (0.5 + 0.5 / week);
      
      // 趋势因子随时间累积
      const cumulativeTrend = trendFactor * week * 0.1;
      
      // 季节性因子
      const seasonalFactor = baseFactor * Math.sin((week / 52) * 2 * Math.PI) * 0.05;
      
      const totalFactor = randomFactor + cumulativeTrend + seasonalFactor;
      const predictedPrice = currentPrice * (1 + totalFactor);
      
      const finalPrice = product.adjustPriceToRange(predictedPrice);
      
      // 计算该预测的可信度（随时间递减）
      const confidence = Math.max(20, 90 - week * 15);
      
      // 确定趋势
      let trend: 'rising' | 'falling' | 'stable' = 'stable';
      if (totalFactor > 0.02) trend = 'rising';
      else if (totalFactor < -0.02) trend = 'falling';

      predictions.push({
        week,
        predictedPrice: Math.round(finalPrice * 100) / 100,
        confidence,
        trend
      });
    }

    // 计算预测影响因子
    const factors = this.calculatePredictionFactors(product, market);

    return {
      productId,
      currentPrice,
      predictions,
      factors
    };
  }

  /**
   * 生成市场分析
   */
  async generateMarketAnalysis(marketId: string): Promise<MarketAnalysis> {
    const market = await this.marketRepository.getMarket(marketId);
    if (!market) {
      throw new Error('市场不存在');
    }

    // 分析整体市场趋势
    const priceIndicator = market.getIndicator('price_index');
    const volumeIndicator = market.getIndicator('volume_index');
    const volatilityIndicator = market.getIndicator('volatility_index');

    let overallTrend: 'bull' | 'bear' | 'sideways' = 'sideways';
    if (priceIndicator && priceIndicator.changePercent > 3) {
      overallTrend = 'bull';
    } else if (priceIndicator && priceIndicator.changePercent < -3) {
      overallTrend = 'bear';
    }

    // 分析波动性水平
    let volatilityLevel: 'low' | 'medium' | 'high' | 'extreme' = 'medium';
    if (volatilityIndicator) {
      if (volatilityIndicator.value < 10) volatilityLevel = 'low';
      else if (volatilityIndicator.value < 30) volatilityLevel = 'medium';
      else if (volatilityIndicator.value < 50) volatilityLevel = 'high';
      else volatilityLevel = 'extreme';
    }

    // 分析流动性水平
    let liquidityLevel: 'low' | 'medium' | 'high' = 'medium';
    if (volumeIndicator) {
      if (volumeIndicator.value < 30) liquidityLevel = 'low';
      else if (volumeIndicator.value > 70) liquidityLevel = 'high';
    }

    // 为支持的产品生成推荐
    const recommendedActions = [];
    for (const productId of market.supportedProducts) {
      const recommendation = await this.generateProductRecommendation(productId, marketId);
      if (recommendation) {
        recommendedActions.push(recommendation);
      }
    }

    return {
      overallTrend,
      volatilityLevel,
      liquidityLevel,
      recommendedActions
    };
  }

  /**
   * 计算价格影响因子
   */
  private calculatePriceFactors(
    product: Product,
    market: Market,
    week: number,
    marketModifiers?: Record<string, number>,
    locationModifiers?: Record<string, number>,
    eventModifiers?: MarketEvent[]
  ): PriceFactor[] {
    const factors: PriceFactor[] = [];

    // 1. 供需因子
    const supplyDemandImpact = (product.marketData.demand - product.marketData.supply) / 100;
    factors.push({
      name: '供需关系',
      impact: supplyDemandImpact,
      description: product.marketData.demand > product.marketData.supply ? '需求旺盛' : '供应充足',
      weight: 0.3
    });

    // 2. 市场趋势因子
    const marketTrendImpact = this.getMarketTrendImpact(market.trend);
    factors.push({
      name: '市场趋势',
      impact: marketTrendImpact,
      description: `市场整体${market.trend === 'bull' ? '上涨' : market.trend === 'bear' ? '下跌' : '震荡'}`,
      weight: 0.2
    });

    // 3. 季节性因子
    const seasonalImpact = this.calculateSeasonalImpact(product, week);
    factors.push({
      name: '季节性',
      impact: seasonalImpact.impact,
      description: seasonalImpact.description,
      weight: 0.15
    });

    // 4. 波动性因子
    const volatilityImpact = (product.marketData.volatility - 50) / 100 * 0.1;
    factors.push({
      name: '市场波动',
      impact: volatilityImpact,
      description: product.marketData.volatility > 50 ? '高波动性' : '低波动性',
      weight: 0.1
    });

    // 5. 库存因子
    const stockLevel = product.availability.quantity / (product.availability.maxQuantity || 100);
    const stockImpact = (0.5 - stockLevel) * 0.2; // 库存少则价格上涨
    factors.push({
      name: '库存水平',
      impact: stockImpact,
      description: stockLevel < 0.3 ? '库存紧张' : stockLevel > 0.7 ? '库存充足' : '库存正常',
      weight: 0.1
    });

    // 6. 市场修正因子
    if (marketModifiers) {
      for (const [name, value] of Object.entries(marketModifiers)) {
        factors.push({
          name: `市场修正-${name}`,
          impact: value,
          description: `外部市场因素影响`,
          weight: 0.05
        });
      }
    }

    // 7. 地点修正因子
    if (locationModifiers) {
      for (const [name, value] of Object.entries(locationModifiers)) {
        factors.push({
          name: `地点修正-${name}`,
          impact: value,
          description: `地理位置因素影响`,
          weight: 0.05
        });
      }
    }

    // 8. 事件修正因子
    if (eventModifiers && eventModifiers.length > 0) {
      for (const event of eventModifiers) {
        if (event.isActive) {
          const eventEffect = event.effects.find(e => e.productId === product.id);
          if (eventEffect) {
            const eventImpact = (eventEffect.priceMultiplier - 1);
            factors.push({
              name: `事件-${event.title}`,
              impact: eventImpact,
              description: event.description,
              weight: event.severity === 'critical' ? 0.3 : event.severity === 'high' ? 0.2 : 0.1
            });
          }
        }
      }
    }

    return factors;
  }

  /**
   * 计算市场趋势影响
   */
  private getMarketTrendImpact(trend: string): number {
    switch (trend) {
      case 'bull': return 0.05; // 牛市推高价格
      case 'bear': return -0.05; // 熊市压低价格
      default: return 0; // 震荡市场无影响
    }
  }

  /**
   * 计算季节性影响
   */
  private calculateSeasonalImpact(product: Product, week: number): { impact: number; description: string } {
    const season = Math.floor((week - 1) / 13) % 4; // 0=春, 1=夏, 2=秋, 3=冬
    const seasonNames = ['春季', '夏季', '秋季', '冬季'];

    // 根据商品类别和季节计算影响
    switch (product.category) {
      case 'food':
        // 食品类商品季节性影响较大
        const foodImpacts = [0.02, -0.01, 0.03, -0.02]; // 春涨、夏跌、秋涨、冬跌
        return {
          impact: foodImpacts[season],
          description: `${seasonNames[season]}食品价格${foodImpacts[season] > 0 ? '上涨' : '下跌'}`
        };
        
      case 'luxury':
        // 奢侈品节假日季节影响
        const luxuryImpacts = [0.01, 0.02, 0.01, 0.05]; // 冬季节假日需求最高
        return {
          impact: luxuryImpacts[season],
          description: `${seasonNames[season]}奢侈品需求${luxuryImpacts[season] > 0.02 ? '旺盛' : '一般'}`
        };
        
      default:
        // 其他商品季节性影响较小
        return {
          impact: (Math.random() - 0.5) * 0.02,
          description: `${seasonNames[season]}常规商品价格稳定`
        };
    }
  }

  /**
   * 计算基础季节因子（用于预测）
   */
  private calculateBaseSeasonalFactor(product: Product): number {
    switch (product.category) {
      case 'food': return 0.8;
      case 'luxury': return 1.2;
      case 'daily': return 0.3;
      default: return 0.5;
    }
  }

  /**
   * 计算趋势因子
   */
  private calculateTrendFactor(product: Product): number {
    switch (product.marketData.trend) {
      case 'rising': return 0.02;
      case 'falling': return -0.02;
      default: return 0;
    }
  }

  /**
   * 计算预测影响因子
   */
  private calculatePredictionFactors(product: Product, market: Market): PriceFactor[] {
    return [
      {
        name: '历史趋势',
        impact: this.calculateTrendFactor(product),
        description: `商品历史价格${product.marketData.trend === 'rising' ? '上涨' : product.marketData.trend === 'falling' ? '下跌' : '稳定'}趋势`,
        weight: 0.4
      },
      {
        name: '市场环境',
        impact: this.getMarketTrendImpact(market.trend),
        description: `整体市场环境${market.trend === 'bull' ? '乐观' : market.trend === 'bear' ? '悲观' : '中性'}`,
        weight: 0.3
      },
      {
        name: '商品特性',
        impact: product.getCategoryInfo().volatilityMultiplier * 0.01,
        description: `${product.getCategoryInfo().name}类商品特性`,
        weight: 0.2
      },
      {
        name: '不确定性',
        impact: 0,
        description: '未来存在不可预测因素',
        weight: 0.1
      }
    ];
  }

  /**
   * 计算可信度
   */
  private calculateConfidence(factors: PriceFactor[], product: Product, market: Market): number {
    // 基础可信度
    let confidence = 70;

    // 根据波动性调整
    const volatility = product.marketData.volatility;
    confidence -= volatility * 0.5; // 高波动性降低可信度

    // 根据市场活跃度调整
    const volume = market.statistics.dailyVolume;
    if (volume > 10000) confidence += 10; // 高交易量提高可信度
    else if (volume < 1000) confidence -= 10; // 低交易量降低可信度

    // 根据因子一致性调整
    const positiveFactors = factors.filter(f => f.impact > 0).length;
    const negativeFactors = factors.filter(f => f.impact < 0).length;
    const factorConsistency = Math.abs(positiveFactors - negativeFactors) / factors.length;
    confidence += factorConsistency * 20; // 因子方向一致性高则提高可信度

    return Math.max(10, Math.min(95, Math.round(confidence)));
  }

  /**
   * 生成投资建议
   */
  private generateRecommendation(
    priceChangePercent: number, 
    confidence: number, 
    factors: PriceFactor[]
  ): 'buy' | 'sell' | 'hold' {
    // 只有在高可信度下才给出买卖建议
    if (confidence < 60) return 'hold';

    // 根据价格变化和可信度生成建议
    if (priceChangePercent > 3 && confidence > 70) {
      // 价格预期上涨，建议买入
      return 'buy';
    } else if (priceChangePercent < -3 && confidence > 70) {
      // 价格预期下跌，建议卖出
      return 'sell';
    } else {
      return 'hold';
    }
  }

  /**
   * 为特定商品生成推荐
   */
  private async generateProductRecommendation(
    productId: string, 
    marketId: string
  ): Promise<{ action: 'buy' | 'sell' | 'hold'; productId: string; confidence: number; reason: string } | null> {
    try {
      const result = await this.calculateCurrentPrice({
        productId,
        marketId,
        week: 1 // 简化处理
      });

      let reason = '';
      if (result.recommendation === 'buy') {
        reason = `预期价格上涨${result.priceChangePercent.toFixed(1)}%`;
      } else if (result.recommendation === 'sell') {
        reason = `预期价格下跌${Math.abs(result.priceChangePercent).toFixed(1)}%`;
      } else {
        reason = '价格相对稳定，建议观望';
      }

      return {
        action: result.recommendation,
        productId,
        confidence: result.confidence,
        reason
      };
    } catch {
      return null;
    }
  }
}

// 导入必要的仓储接口
interface IProductRepository {
  getProduct(id: string): Promise<Product | null>;
}

interface IMarketRepository {
  getMarket(id: string): Promise<Market | null>;
}