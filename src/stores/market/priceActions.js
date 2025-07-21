import { useMarketStore } from './marketState';
import { 
  calculatePriceWithCache, 
  clearPriceCache, 
  batchUpdatePrices,
  getTrendDescription,
  getTrendIcon,
  getTrendColor,
  measurePriceCalculationPerformance,
  PriceTrend
} from '../../core/services/priceSystem';

/**
 * 价格操作模块
 * 提供价格计算和批量更新功能
 */
export const usePriceActions = () => {
  const marketStore = useMarketStore();
  
  /**
   * 更新所有产品价格
   * @param {number} currentWeek - 当前周数
   */
  const updateProductPrices = (currentWeek) => {
    console.log('开始更新产品价格，当前周数:', currentWeek);
    
    const products = marketStore.products;
    console.log('产品总数:', products.length);
    
    const priceHistory = { ...marketStore.productPrices };
    const marketModifiers = marketStore.marketModifiers;
    
    console.log('市场修正因子:', marketModifiers);
    
    // 临时调试措施：清除价格缓存
    clearPriceCache();
    
    // 使用批量更新以提高性能
    const newPrices = batchUpdatePrices(products, currentWeek, priceHistory, marketModifiers);
    console.log('批量更新后的新价格数量:', Object.keys(newPrices).length);
    
    // 强制价格波动 - 确保每个物品每周都有价格变化
    const forceFluctuation = true;
    
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
   * @param {string} productId - 产品ID
   * @returns {Object} 趋势说明 {text, icon, color}
   */
  const getProductTrendInfo = (productId) => {
    const trend = marketStore.getProductPriceTrend(productId);
    
    return {
      text: getTrendDescription(trend),
      icon: getTrendIcon(trend),
      color: getTrendColor(trend)
    };
  };
  
  /**
   * 计算价格变化百分比文本
   * @param {string} productId - 产品ID
   * @returns {string} 格式化的价格变化百分比文本
   */
  const getPriceChangeText = (productId) => {
    const priceData = marketStore.productPrices[productId];
    if (!priceData || priceData.changePercent === undefined) {
      return '0%';
    }
    
    const changePercent = priceData.changePercent;
    const sign = changePercent > 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(1)}%`;
  };
  
  /**
   * 执行性能测试，测量价格计算效率
   * @param {Array} products - 产品列表
   * @param {number} week - 当前周数
   * @returns {Object} 性能测试结果
   */
  const measurePricePerformance = (products, week) => {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }
    
    const priceHistory = { ...marketStore.productPrices };
    const marketModifiers = marketStore.marketModifiers;
    
    return measurePriceCalculationPerformance(products, week, priceHistory, marketModifiers);
  };
  
  return {
    updateProductPrices,
    getProductTrendInfo,
    getPriceChangeText,
    measurePricePerformance,
    clearPriceCache
  };
}; 