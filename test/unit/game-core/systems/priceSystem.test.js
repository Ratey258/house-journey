import { describe, it, expect, beforeEach } from 'vitest';
import { 
  calculateNewPrice, 
  PriceTrend, 
  calculatePriceWithCache,
  clearPriceCache,
  batchUpdatePrices
} from '../../../../src/game-core/systems/priceSystem';

describe('价格系统测试', () => {
  // 测试数据
  const testProduct = {
    id: 'test_product',
    name: '测试商品',
    basePrice: 500,
    minPrice: 100,
    maxPrice: 1000,
    volatility: 5,
    category: 'FOOD'
  };
  
  const previousPrice = { 
    price: 500, 
    trend: PriceTrend.STABLE,
    history: [500]
  };
  
  const marketModifiers = {
    globalPriceModifier: 1.0,
    categoryModifiers: {
      FOOD: 1.05
    },
    productModifiers: {}
  };
  
  beforeEach(() => {
    // 每个测试前清除缓存
    clearPriceCache();
  });
  
  describe('calculateNewPrice', () => {
    it('应返回包含价格、趋势和变化百分比的对象', () => {
      const result = calculateNewPrice(testProduct, 1, previousPrice, 1, {});
      
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('changePercent');
      expect(typeof result.price).toBe('number');
      expect(typeof result.changePercent).toBe('number');
    });
    
    it('计算的价格应在商品最低和最高价格范围内', () => {
      // 多次测试以确保结果一致性
      for (let i = 0; i < 50; i++) {
        const result = calculateNewPrice(testProduct, i, previousPrice, 1, {});
        
        expect(result.price).toBeGreaterThanOrEqual(testProduct.minPrice);
        expect(result.price).toBeLessThanOrEqual(testProduct.maxPrice);
      }
    });
    
    it('市场修正因子应正确影响价格', () => {
      // 无修正的基准价格
      const baseResult = calculateNewPrice(testProduct, 1, previousPrice, 1, {});
      
      // 上涨市场修正
      const bullishModifiers = { globalPriceModifier: 1.2 };
      const bullishResult = calculateNewPrice(testProduct, 1, previousPrice, 1, bullishModifiers);
      
      // 下跌市场修正
      const bearishModifiers = { globalPriceModifier: 0.8 };
      const bearishResult = calculateNewPrice(testProduct, 1, previousPrice, 1, bearishModifiers);
      
      // 价格应该反映市场修正
      expect(bullishResult.price).toBeGreaterThan(baseResult.price * 1.1);
      expect(bearishResult.price).toBeLessThan(baseResult.price * 0.9);
    });
    
    it('类别修正因子应正确影响价格', () => {
      // 无修正的基准价格
      const baseResult = calculateNewPrice(testProduct, 1, previousPrice, 1, {});
      
      // 类别修正
      const categoryModifiers = { 
        categoryModifiers: { FOOD: 1.2 } 
      };
      const categoryResult = calculateNewPrice(testProduct, 1, previousPrice, 1, categoryModifiers);
      
      // 价格应该反映类别修正
      expect(categoryResult.price).toBeGreaterThan(baseResult.price);
    });
  });
  
  describe('calculatePriceWithCache', () => {
    it('应返回与calculateNewPrice相同结构的结果', () => {
      const result = calculatePriceWithCache(testProduct, 1, previousPrice, 1, {});
      
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('changePercent');
    });
    
    it('相同参数的多次调用应返回相同结果', () => {
      const firstCall = calculatePriceWithCache(testProduct, 1, previousPrice, 1, marketModifiers);
      const secondCall = calculatePriceWithCache(testProduct, 1, previousPrice, 1, marketModifiers);
      
      expect(secondCall.price).toBe(firstCall.price);
      expect(secondCall.trend).toBe(firstCall.trend);
      expect(secondCall.changePercent).toBe(firstCall.changePercent);
    });
    
    it('清除缓存后应重新计算', () => {
      const firstCall = calculatePriceWithCache(testProduct, 1, previousPrice, 1, {});
      
      // 修改市场条件
      const modifiedModifiers = { globalPriceModifier: 1.5 };
      
      // 不清除缓存，结果应该相同
      const secondCall = calculatePriceWithCache(testProduct, 1, previousPrice, 1, modifiedModifiers);
      expect(secondCall.price).toBe(firstCall.price);
      
      // 清除缓存后，结果应该不同
      clearPriceCache();
      const thirdCall = calculatePriceWithCache(testProduct, 1, previousPrice, 1, modifiedModifiers);
      expect(thirdCall.price).not.toBe(firstCall.price);
    });
  });
  
  describe('batchUpdatePrices', () => {
    it('应批量计算多个产品的价格', () => {
      const products = [
        testProduct,
        {
          id: 'product2',
          name: '测试商品2',
          basePrice: 300,
          minPrice: 100,
          maxPrice: 600,
          volatility: 3,
          category: 'ELECTRONICS'
        }
      ];
      
      const priceHistory = {
        'test_product': previousPrice,
        'product2': {
          price: 300,
          trend: PriceTrend.STABLE,
          history: [300]
        }
      };
      
      const results = batchUpdatePrices(products, 1, priceHistory, {});
      
      expect(results).toHaveProperty('test_product');
      expect(results).toHaveProperty('product2');
      expect(results.test_product).toHaveProperty('price');
      expect(results.product2).toHaveProperty('price');
    });
    
    it('批量计算结果应与单独计算结果相同', () => {
      // 清除缓存确保公平比较
      clearPriceCache();
      
      // 单独计算
      const singleResult = calculatePriceWithCache(testProduct, 1, previousPrice, 1, {});
      
      // 批量计算
      const batchResults = batchUpdatePrices([testProduct], 1, { 'test_product': previousPrice }, {});
      
      expect(batchResults.test_product.price).toBe(singleResult.price);
      expect(batchResults.test_product.trend).toBe(singleResult.trend);
    });
  });
}); 