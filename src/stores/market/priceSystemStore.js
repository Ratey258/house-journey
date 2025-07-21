import { defineStore } from 'pinia';
import { useGameProgressStore } from '../gameCore/gameProgressStore';

/**
 * 价格系统状态管理
 * 从market拆分出来，专门负责价格计算和历史记录
 */
export const usePriceSystemStore = defineStore('priceSystem', {
  state: () => ({
    productPrices: {},
    priceHistory: {},
    marketModifiers: {
      global: 1.0,
      categories: {},
      products: {}
    },
    priceCache: {}, // 价格计算缓存
    trendCache: {} // 趋势计算缓存
  }),
  
  actions: {
    /**
     * 初始化价格系统
     */
    initializePriceSystem() {
      this.productPrices = {};
      this.priceHistory = {};
      this.marketModifiers = {
        global: 1.0,
        categories: {},
        products: {}
      };
      this.priceCache = {};
      this.trendCache = {};
    },
    
    /**
     * 更新商品价格
     * @param {number} week - 当前周数
     * @param {Array} products - 商品列表
     */
    updatePrices(week, products) {
      if (!products || !Array.isArray(products)) {
        console.error('PriceSystem - 更新价格失败: 无效的商品列表');
        return;
      }
      
      // 批量更新所有商品价格
      this.batchUpdatePrices(products, week);
      
      // 清理不再需要的缓存
      this.cleanupCache();
    },
    
    /**
     * 批量更新价格
     * @param {Array} products - 商品列表
     * @param {number} week - 当前周数
     */
    batchUpdatePrices(products, week) {
      // 创建一个新的价格对象，避免直接修改state
      const newPrices = { ...this.productPrices };
      
      // 为每个商品计算新价格
      products.forEach(product => {
        const productId = String(product.id);
        
        // 获取当前价格，如果不存在则使用基础价格
        const currentPrice = this.productPrices[productId]?.price || product.basePrice;
        
        // 计算新价格
        const newPrice = this.calculateNewPrice(
          product,
          currentPrice,
          week
        );
        
        // 更新价格对象
        newPrices[productId] = {
          price: newPrice,
          lastUpdated: week,
          trend: this.calculatePriceTrend(productId, currentPrice, newPrice)
        };
        
        // 更新价格历史
        this.updatePriceHistory(productId, newPrice, week);
      });
      
      // 一次性更新状态，减少重渲染
      this.productPrices = newPrices;
    },
    
    /**
     * 计算新价格
     * @param {Object} product - 商品对象
     * @param {number} currentPrice - 当前价格
     * @param {number} week - 当前周数
     * @returns {number} 新价格
     */
    calculateNewPrice(product, currentPrice, week) {
      // 生成缓存键
      const cacheKey = `${product.id}-${week}-${currentPrice.toFixed(2)}`;
      
      // 检查缓存
      if (this.priceCache[cacheKey]) {
        return this.priceCache[cacheKey];
      }
      
      // 基础价格
      const basePrice = product.basePrice || 100;
      
      // 波动率 (volatility)
      const volatility = product.volatility || 0.1;
      
      // 计算周期因子 (使用正弦函数模拟周期性波动)
      const periodFactor = Math.sin(week / (product.period || 8)) * 0.1;
      
      // 随机因子 (添加一些随机性)
      const randomFactor = (Math.random() - 0.5) * volatility;
      
      // 趋势因子 (如果有趋势，则继续该趋势)
      const trend = this.productPrices[product.id]?.trend || 0;
      const trendFactor = trend * 0.7; // 趋势延续性，0.7表示70%的趋势会延续
      
      // 市场修正因子
      const marketModifier = this.getMarketModifier(product);
      
      // 计算价格变化百分比
      const changePercent = periodFactor + randomFactor + trendFactor;
      
      // 应用价格变化
      let newPrice = currentPrice * (1 + changePercent) * marketModifier;
      
      // 确保价格在合理范围内
      const minPrice = basePrice * 0.4;
      const maxPrice = basePrice * 2.5;
      newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
      
      // 四舍五入到整数
      newPrice = Math.round(newPrice);
      
      // 缓存计算结果
      this.priceCache[cacheKey] = newPrice;
      
      return newPrice;
    },
    
    /**
     * 计算价格趋势
     * @param {string} productId - 商品ID
     * @param {number} oldPrice - 旧价格
     * @param {number} newPrice - 新价格
     * @returns {number} 趋势值 (-1到1之间)
     */
    calculatePriceTrend(productId, oldPrice, newPrice) {
      // 如果没有旧价格，返回0（无趋势）
      if (!oldPrice) return 0;
      
      // 计算价格变化百分比
      const changePercent = (newPrice - oldPrice) / oldPrice;
      
      // 将变化映射到-1到1之间的值
      // 变化超过20%会被视为极端趋势(1或-1)
      let trend = changePercent * 5; // 放大变化
      trend = Math.max(-1, Math.min(1, trend)); // 限制在-1到1之间
      
      return trend;
    },
    
    /**
     * 更新价格历史
     * @param {string} productId - 商品ID
     * @param {number} price - 价格
     * @param {number} week - 周数
     */
    updatePriceHistory(productId, price, week) {
      // 如果没有该商品的历史记录，创建一个
      if (!this.priceHistory[productId]) {
        this.priceHistory[productId] = [];
      }
      
      // 添加新的价格记录
      this.priceHistory[productId].push({
        week,
        price,
        timestamp: new Date().toISOString()
      });
      
      // 限制历史记录长度，保留最近30条
      if (this.priceHistory[productId].length > 30) {
        this.priceHistory[productId].shift();
      }
    },
    
    /**
     * 获取市场修正因子
     * @param {Object} product - 商品对象
     * @returns {number} 市场修正因子
     */
    getMarketModifier(product) {
      // 全局修正
      let modifier = this.marketModifiers.global || 1.0;
      
      // 类别修正
      if (product.category && this.marketModifiers.categories[product.category]) {
        modifier *= this.marketModifiers.categories[product.category];
      }
      
      // 商品特定修正
      if (this.marketModifiers.products[product.id]) {
        modifier *= this.marketModifiers.products[product.id];
      }
      
      return modifier;
    },
    
    /**
     * 设置市场修正因子
     * @param {string} type - 修正类型 (global/category/product)
     * @param {string} key - 修正键 (类别名或商品ID)
     * @param {number} value - 修正值
     */
    setMarketModifier(type, key, value) {
      if (type === 'global') {
        this.marketModifiers.global = value;
      } else if (type === 'category' && key) {
        this.marketModifiers.categories[key] = value;
      } else if (type === 'product' && key) {
        this.marketModifiers.products[key] = value;
      }
    },
    
    /**
     * 获取商品价格趋势
     * @param {string} productId - 商品ID
     * @returns {Object} 趋势信息
     */
    getProductPriceTrend(productId) {
      // 检查缓存
      if (this.trendCache[productId]) {
        return this.trendCache[productId];
      }
      
      // 获取历史价格
      const history = this.priceHistory[productId];
      if (!history || history.length < 2) {
        return { trend: 'stable', strength: 0 };
      }
      
      // 计算最近的趋势
      const recentHistory = history.slice(-5); // 最近5周
      const priceChanges = [];
      
      for (let i = 1; i < recentHistory.length; i++) {
        const prevPrice = recentHistory[i-1].price;
        const currPrice = recentHistory[i].price;
        priceChanges.push((currPrice - prevPrice) / prevPrice);
      }
      
      // 计算平均变化
      const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
      
      // 确定趋势方向和强度
      let trend, strength;
      
      if (avgChange > 0.03) {
        trend = 'rising';
        strength = Math.min(1, avgChange * 10); // 将变化映射到0-1范围
      } else if (avgChange < -0.03) {
        trend = 'falling';
        strength = Math.min(1, Math.abs(avgChange) * 10);
      } else {
        trend = 'stable';
        strength = Math.min(1, Math.abs(avgChange) * 5);
      }
      
      // 缓存结果
      const result = { trend, strength };
      this.trendCache[productId] = result;
      
      return result;
    },
    
    /**
     * 清理缓存
     * 移除不再需要的缓存项
     */
    cleanupCache() {
      // 限制缓存大小
      const maxCacheSize = 1000;
      
      // 如果缓存过大，清空一半
      if (Object.keys(this.priceCache).length > maxCacheSize) {
        this.priceCache = {};
      }
      
      // 清空趋势缓存（每次价格更新后都需要重新计算）
      this.trendCache = {};
    }
  },
  
  getters: {
    /**
     * 获取当前周数
     * @returns {number} 当前周数
     */
    currentWeek() {
      return useGameProgressStore().currentWeek;
    },
    
    /**
     * 获取所有商品的价格趋势
     * @returns {Object} 价格趋势对象
     */
    allPriceTrends() {
      const trends = {};
      
      for (const productId in this.productPrices) {
        trends[productId] = this.getProductPriceTrend(productId);
      }
      
      return trends;
    }
  }
}); 