/**
 * 价格操作模块 - TypeScript版本
 * 提供价格计算和批量更新功能
 */

import { useMarketStore } from './marketState';
import { 
  calculatePriceWithCache, 
  clearPriceCache, 
  batchUpdatePrices,
  PriceTrend
} from '../../core/services/priceSystem';

// ==================== 趋势辅助函数 ====================

/**
 * 获取趋势描述
 */
const getTrendDescription = (trend: PriceTrend): string => {
  const descriptions: Record<PriceTrend, string> = {
    [PriceTrend.RISING_STRONG]: '强势上涨',
    [PriceTrend.RISING]: '上涨',
    [PriceTrend.STABLE_HIGH]: '高位稳定',
    [PriceTrend.STABLE]: '稳定',
    [PriceTrend.STABLE_LOW]: '低位稳定',
    [PriceTrend.FALLING]: '下跌',
    [PriceTrend.FALLING_STRONG]: '强势下跌',
    [PriceTrend.VOLATILE]: '波动'
  };
  return descriptions[trend] || '未知';
};

/**
 * 获取趋势图标
 */
const getTrendIcon = (trend: PriceTrend): string => {
  const icons: Record<PriceTrend, string> = {
    [PriceTrend.RISING_STRONG]: '📈',
    [PriceTrend.RISING]: '↗️',
    [PriceTrend.STABLE_HIGH]: '➡️',
    [PriceTrend.STABLE]: '➡️',
    [PriceTrend.STABLE_LOW]: '➡️',
    [PriceTrend.FALLING]: '↘️',
    [PriceTrend.FALLING_STRONG]: '📉',
    [PriceTrend.VOLATILE]: '📊'
  };
  return icons[trend] || '❓';
};

/**
 * 获取趋势颜色
 */
const getTrendColor = (trend: PriceTrend): string => {
  const colors: Record<PriceTrend, string> = {
    [PriceTrend.RISING_STRONG]: '#00C851',
    [PriceTrend.RISING]: '#00C851',
    [PriceTrend.STABLE_HIGH]: '#ffbb33',
    [PriceTrend.STABLE]: '#666666',
    [PriceTrend.STABLE_LOW]: '#ffbb33',
    [PriceTrend.FALLING]: '#ff4444',
    [PriceTrend.FALLING_STRONG]: '#ff4444',
    [PriceTrend.VOLATILE]: '#33b5e5'
  };
  return colors[trend] || '#666666';
};

// ==================== 类型定义 ====================

/**
 * 产品接口（简化版）
 */
export interface Product {
  id: number;
  name: string;
  basePrice: number;
  [key: string]: any;
}

/**
 * 价格数据接口
 */
export interface PriceData {
  price: number;
  prevPrice: number;
  trend: PriceTrend;
  changePercent: number;
  originalPricePercent: number;
  history: number[];
}

/**
 * 趋势信息接口
 */
export interface TrendInfo {
  text: string;
  icon: string;
  color: string;
}

/**
 * 性能测试结果接口
 */
export interface PerformanceResult {
  [key: string]: any;
}

// ==================== 价格操作服务 ====================

/**
 * 价格操作模块服务
 */
export const usePriceActions = () => {
  const marketStore = useMarketStore();
  
  /**
   * 更新所有产品价格
   * @param currentWeek 当前周数
   */
  const updateProductPrices = (currentWeek: number): void => {
    console.log('开始更新产品价格，当前周数:', currentWeek);
    
    const products: any[] = marketStore.products;
    console.log('产品总数:', products.length);
    
    const priceHistory: Record<string, any> = { ...marketStore.productPrices };
    const marketModifiers: any = marketStore.marketModifiers;
    
    console.log('市场修正因子:', marketModifiers);
    
    // 临时调试措施：清除价格缓存
    clearPriceCache();
    
    // 使用批量更新以提高性能
    const newPrices: Record<string, any> = batchUpdatePrices(products, currentWeek, priceHistory, marketModifiers);
    console.log('批量更新后的新价格数量:', Object.keys(newPrices).length);
    
    // 强制价格波动 - 确保每个物品每周都有价格变化
    const forceFluctuation: boolean = true;
    
    // 更新价格状态
    Object.keys(newPrices).forEach(productId => {
      const prevPriceData = priceHistory[productId] || { price: 0, history: [] };
      const newPriceData = newPrices[productId];
      
      // 确保有前一个价格用于计算变化百分比
      const prevPrice = prevPriceData.price || products.find(p => p.id === Number(productId))?.basePrice || 0;
      
      // 强制价格波动 - 更加夸张的波动，且偏向下跌
      if (forceFluctuation) {
        // 检查价格是否变化
        const priceChanged = Math.abs(newPriceData.price - prevPrice) >= 1;
        
        // 如果价格变化太小或者变化百分比太小，强制波动
        if (!priceChanged || Math.abs(newPriceData.changePercent) < 1.0) {
          // 使用商品ID和周数作为随机种子，确保同一商品在同一周有一致的价格变动方向
          const productSeed = parseInt(productId) || 0;
          const weekSeed = currentWeek || 0;
          const combinedSeed = (productSeed * 31 + weekSeed) % 100; // 0-99的随机数
          
          // 根据商品ID和周数决定价格变动方向，确保不同商品有不同的变动方向
          // 30%概率上涨，70%概率下跌，但每个商品在同一周的方向是确定的
          const direction = combinedSeed < 30 ? 1 : -1;
          
          // 使用伪随机函数生成变化幅度，确保同一商品在同一周有相同的变化幅度
          const pseudoRandom = Math.abs(Math.sin(combinedSeed * 0.1)) * 12; // 0-12的伪随机数
          const randomChange = Math.max(3.0, pseudoRandom); // 至少3%的随机变化
          const changeRatio = 1 + (direction * randomChange / 100);
          
          // 修改价格
          newPriceData.price = Math.round(prevPrice * changeRatio);
          
          console.log(`强制价格波动 - 商品ID: ${productId}, 原价: ${prevPrice}, 新价: ${newPriceData.price}, 方向: ${direction > 0 ? '上涨' : '下跌'}, 变化幅度: ${randomChange.toFixed(1)}%`);
        }
      }
      
      // 确保changePercent不为0
      if (newPriceData.changePercent === 0 && prevPrice > 0) {
        // 获取商品的原始基础价格
        const basePrice = products.find(p => p.id === Number(productId))?.basePrice || prevPrice;
        // 基于原始基础价格计算变化百分比
        newPriceData.changePercent = ((newPriceData.price - basePrice) / basePrice) * 100;
        newPriceData.changePercent = parseFloat(newPriceData.changePercent.toFixed(1));
      }
      
      // 更新价格数据，保留历史记录
      marketStore.productPrices[productId] = {
        price: newPriceData.price,
        prevPrice: prevPrice,
        trend: newPriceData.trend,
        changePercent: newPriceData.changePercent,
        originalPricePercent: newPriceData.originalPricePercent,
        history: [...(prevPriceData.history || []), newPriceData.price].slice(-20) // 保留最近20周
      };
      
      const product = products.find(p => p.id === Number(productId));
      if (product) {
        console.log(`商品 ${product.name}(ID:${productId}) 价格更新 - 基础价格: ${product.basePrice}, 当前价格: ${newPriceData.price}, 历史: [${marketStore.productPrices[productId].history.join(', ')}]`);
        
        // 在价格更新后，重新计算长期趋势
        const { trend, changePercent } = marketStore.calculateLongTermTrend(productId, product.basePrice);
        marketStore.productPrices[productId].trend = trend;
        marketStore.productPrices[productId].changePercent = changePercent;
        
        console.log(`商品 ${product.name}(ID:${productId}) 趋势更新 - 趋势: ${trend}, 变化百分比: ${changePercent}%`);
      }
    });
    
    // 更新当前地点可用商品
    marketStore.updateLocationProducts();
    
    console.log('价格更新完成');
  };
  
  /**
   * 获取商品的价格趋势说明
   * @param productId 产品ID
   * @returns 趋势说明
   */
  const getProductTrendInfo = (productId: string | number): TrendInfo => {
    const trend: PriceTrend = marketStore.getProductPriceTrend(productId);
    
    return {
      text: getTrendDescription(trend),
      icon: getTrendIcon(trend),
      color: getTrendColor(trend)
    };
  };
  
  /**
   * 计算价格变化百分比文本
   * @param productId 产品ID
   * @returns 格式化的价格变化百分比文本
   */
  const getPriceChangeText = (productId: string | number): string => {
    const priceData: any = marketStore.productPrices[productId];
    if (!priceData || priceData.changePercent === undefined) {
      return '0%';
    }
    
    const changePercent: number = priceData.changePercent;
    const sign: string = changePercent > 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(1)}%`;
  };
  
  /**
   * 执行性能测试，测量价格计算效率
   * @param products 产品列表
   * @param week 当前周数
   * @returns 性能测试结果
   */
  const measurePricePerformance = (products: any[], week: number): PerformanceResult | null => {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }
    
    const priceHistory: Record<string, any> = { ...marketStore.productPrices };
    const marketModifiers: any = marketStore.marketModifiers;
    
    return measurePriceCalculationPerformance(products, week, priceHistory, marketModifiers);
  };
  
  // ==================== 返回服务接口 ====================

  return {
    updateProductPrices,
    getProductTrendInfo,
    getPriceChangeText,
    measurePricePerformance,
    clearPriceCache
  };
};

// ==================== 服务类型导出 ====================

/**
 * 价格操作服务返回类型
 */
export type PriceActionsService = ReturnType<typeof usePriceActions>; 