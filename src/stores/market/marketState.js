import { defineStore } from 'pinia';
import { getAllProducts } from '../../core/models/product';
import { getAllLocations } from '../../core/models/location';
import { getAllHouses } from '../../core/models/house';
import { PriceTrend } from '../../core/services/priceSystem';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';
import { usePriceActions } from './priceActions';

/**
 * 市场状态管理
 * 负责市场价格、地点、房屋等数据
 */
export const useMarketStore = defineStore('market', {
  state: () => ({
    // 地点相关
    locations: [],
    currentLocation: null,
    
    // 商品相关
    productPrices: {},
    products: [],
    availableProducts: [],
    
    // 房屋相关
    houses: [],
    
    // 市场调整因子
    marketModifiers: {
      globalPriceModifier: 1,
      categoryModifiers: {},
      productModifiers: {},
      weeksSinceLastGlobalChange: 0, // 新增：记录全局价格修正因子连续未变化的周数
      categoryUnchangedWeeks: {}, // 新增：记录类别修正因子连续未变化的周数
      productUnchangedWeeks: {} // 新增：记录商品修正因子连续未变化的周数
    },
    
    // 初始化状态
    initialized: false
  }),
  
  actions: {
    /**
     * 初始化市场数据
     * @returns {Promise} 初始化完成的Promise
     */
    initializeMarket() {
      return new Promise((resolve, reject) => {
        try {
          // 模拟加载过程
          setTimeout(() => {
            // 获取地点
            this.locations = getAllLocations();
            
            // 获取商品
            this.products = getAllProducts();
            
            // 初始化房屋
            this.houses = getAllHouses();
            
            // 初始化价格
            this.initializeProductPrices();
            
            // 初始化市场调整因子
            this.marketModifiers = {
              globalPriceModifier: 1,
              categoryModifiers: {},
              productModifiers: {},
              weeksSinceLastGlobalChange: 0, // 初始化计数器
              categoryUnchangedWeeks: {}, // 初始化计数器
              productUnchangedWeeks: {} // 初始化计数器
            };
            
            // 设置初始地点
            if (this.locations.length > 0) {
              this.changeLocation(this.locations[0].id);
              
              // 确保更新当前地点的可用商品
              this.updateLocationProducts();
            }
            
            // 标记为已初始化
            this.initialized = true;
            console.log('MarketStore - 市场初始化完成');
            console.log('可用商品数量:', this.availableProducts.length);
            resolve();
          }, 500);
        } catch (error) {
          handleError(error, 'marketState (market)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
          console.error('MarketStore - 初始化市场失败:', error);
          reject(error);
        }
      });
    },
    
    /**
     * 初始化产品价格
     */
    initializeProductPrices() {
      this.productPrices = {};
      this.products.forEach(product => {
        // 初始价格设置在最低价和最高价之间的随机值
        const initialPrice = Math.floor(Math.random() * (product.maxPrice - product.minPrice) + product.minPrice);
        
        this.productPrices[product.id] = {
          price: initialPrice,
          trend: PriceTrend.STABLE,
          history: [initialPrice],
          changePercent: 0
        };
      });
    },
    
    /**
     * 更新市场状态
     * @param {number} currentWeek - 当前周数
     */
    updateMarketState(currentWeek) {
      console.log('MarketStore - 更新市场状态, 当前周数:', currentWeek);
      
      // 更新市场修正因子
      this.updateMarketModifiers();
      
      try {
        // 导入并使用priceActions中的方法
        const { updateProductPrices } = usePriceActions();
        
        // 确保价格更新函数存在
        if (typeof updateProductPrices !== 'function') {
          console.error('MarketStore - updateProductPrices 不是一个函数');
          return;
        }
        
        // 更新商品价格
        updateProductPrices(currentWeek);
        console.log('MarketStore - 商品价格已更新');
      } catch (error) {
        console.error('MarketStore - 更新商品价格时出错:', error);
      }
      
      // 更新当前地点的商品
      this.updateLocationProducts();
    },
    
    /**
     * 更新市场调整因子
     */
    updateMarketModifiers() {
      // 添加市场平衡机制，避免极端情况连续出现
      const productTrends = Object.values(this.productPrices || {}).map(p => p?.trend || 'stable');
      const risingCount = productTrends.filter(t => t.includes('rising')).length;
      const fallingCount = productTrends.filter(t => t.includes('falling')).length;
      const totalProducts = productTrends.length || 1;
      
      // 计算上涨和下跌的比例
      const risingRatio = risingCount / totalProducts;
      const fallingRatio = fallingCount / totalProducts;
      
      // 检测是否处于极端市场状态
      const isExtremeBullMarket = risingRatio > 0.7; // 超过70%的商品上涨
      const isExtremeBearMarket = fallingRatio > 0.7; // 超过70%的商品下跌
      
      console.log(`市场状态检测 - 上涨比例: ${(risingRatio * 100).toFixed(1)}%, 下跌比例: ${(fallingRatio * 100).toFixed(1)}%`);
      
      // 每周随机变化全局价格修正 - 更加夸张的波动，且偏向下跌，但添加平衡机制
      const globalChangeChance = Math.random();
      if (globalChangeChance < 0.4 || this.marketModifiers.weeksSinceLastGlobalChange > 2) { // 40%的概率发生变化，或者连续3周没变化
        let changeAmount;
        
        // 根据市场状态调整价格变化方向，实现自我平衡
        if (isExtremeBullMarket) {
          // 如果市场过热，增加下跌概率和幅度
          changeAmount = (Math.random() * 0.15) - 0.12; // -12% to +3%，强烈偏向下跌
          console.log('市场过热，触发平衡机制，价格调整偏向下跌');
        } else if (isExtremeBearMarket) {
          // 如果市场过冷，增加上涨概率和幅度
          changeAmount = (Math.random() * 0.15) - 0.03; // -3% to +12%，强烈偏向上涨
          console.log('市场过冷，触发平衡机制，价格调整偏向上涨');
        } else {
          // 正常市场状态，维持略微偏向下跌的调整
          changeAmount = (Math.random() * 0.15) - 0.1; // -10% to +5%，偏向下跌
        }
        
        this.marketModifiers.globalPriceModifier = Math.max(0.7, Math.min(1.3, this.marketModifiers.globalPriceModifier + changeAmount));
        this.marketModifiers.weeksSinceLastGlobalChange = 0; // 重置计数器
      } else {
        // 增加连续未变化的周数计数
        this.marketModifiers.weeksSinceLastGlobalChange = (this.marketModifiers.weeksSinceLastGlobalChange || 0) + 1;
      }
      
      // 随机更新类别修正 - 更加夸张的波动，且偏向下跌，但添加平衡机制
      const categories = ['FOOD', 'ELECTRONICS', 'LUXURY', 'DAILY', 'COLLECTIBLE'];
      
      // 初始化类别未变化周数计数
      if (!this.marketModifiers.categoryUnchangedWeeks) {
        this.marketModifiers.categoryUnchangedWeeks = {};
        categories.forEach(cat => {
          this.marketModifiers.categoryUnchangedWeeks[cat] = 0;
        });
      }
      
      // 为每个类别随机更新修正因子
      categories.forEach(category => {
        const categoryChangeChance = Math.random();
        const weeksUnchanged = this.marketModifiers.categoryUnchangedWeeks[category] || 0;
        
        // 30%的概率随机调整，或者连续3周没变化
        if (categoryChangeChance < 0.3 || weeksUnchanged > 2) { 
          // 获取该类别商品的趋势
          const categoryProducts = this.products.filter(p => p.category === category);
          const categoryProductIds = categoryProducts.map(p => p.id);
          const categoryTrends = categoryProductIds
            .map(id => this.productPrices[id]?.trend || 'stable')
            .filter(Boolean);
          
          const catRisingCount = categoryTrends.filter(t => t.includes('rising')).length;
          const catFallingCount = categoryTrends.filter(t => t.includes('falling')).length;
          const catTotalCount = categoryTrends.length || 1;
          
          let categoryChange;
          
          // 根据类别内商品趋势调整价格变化方向，实现局部平衡
          if (catRisingCount / catTotalCount > 0.6) {
            // 该类别大部分商品上涨，增加下跌概率
            categoryChange = (Math.random() * 0.3) - 0.25; // -25% to +5%，强烈偏向下跌
          } else if (catFallingCount / catTotalCount > 0.6) {
            // 该类别大部分商品下跌，增加上涨概率
            categoryChange = (Math.random() * 0.3) - 0.05; // -5% to +25%，强烈偏向上涨
          } else {
            // 类别内趋势平衡，维持略微偏向下跌的调整
            categoryChange = (Math.random() * 0.3) - 0.2; // -20% to +10%，偏向下跌
          }
          
          // 更新或创建类别修正
          this.marketModifiers.categoryModifiers[category] = 
            Math.max(0.6, Math.min(1.4, (this.marketModifiers.categoryModifiers[category] || 1) + categoryChange));
          
          // 重置未变化周数计数
          this.marketModifiers.categoryUnchangedWeeks[category] = 0;
          
          console.log(`类别 ${category} 价格修正更新为: ${this.marketModifiers.categoryModifiers[category].toFixed(2)}`);
        } else {
          // 增加未变化周数计数
          this.marketModifiers.categoryUnchangedWeeks[category] = weeksUnchanged + 1;
        }
      });
      
      // 初始化商品未变化周数计数
      if (!this.marketModifiers.productUnchangedWeeks) {
        this.marketModifiers.productUnchangedWeeks = {};
      }
      
      // 随机为单个商品添加特殊修正 - 更加夸张的波动，且确保每周有一些反向波动的商品
      const productCount = this.products.length;
      if (productCount > 0) {
        // 确保至少有10%的商品有反向波动趋势
        const counterTrendCount = Math.max(2, Math.floor(productCount * 0.1));
        
        // 如果市场整体上涨，选择一些商品下跌
        if (isExtremeBullMarket) {
          for (let i = 0; i < counterTrendCount; i++) {
            const randomIndex = Math.floor(Math.random() * productCount);
            const randomProduct = this.products[randomIndex];
            if (randomProduct) {
              // 强制下跌修正
              this.marketModifiers.productModifiers[randomProduct.id] = 0.7; // 30%的下跌修正
              // 重置未变化周数计数
              this.marketModifiers.productUnchangedWeeks[randomProduct.id] = 0;
            }
          }
          console.log(`市场过热，为${counterTrendCount}个商品添加下跌修正`);
        } 
        // 如果市场整体下跌，选择一些商品上涨
        else if (isExtremeBearMarket) {
          for (let i = 0; i < counterTrendCount; i++) {
            const randomIndex = Math.floor(Math.random() * productCount);
            const randomProduct = this.products[randomIndex];
            if (randomProduct) {
              // 强制上涨修正
              this.marketModifiers.productModifiers[randomProduct.id] = 1.3; // 30%的上涨修正
              // 重置未变化周数计数
              this.marketModifiers.productUnchangedWeeks[randomProduct.id] = 0;
            }
          }
          console.log(`市场过冷，为${counterTrendCount}个商品添加上涨修正`);
        }
      }
      
      // 常规的随机商品修正
      const productChangeChance = Math.random();
      if (productChangeChance < 0.15 && this.products.length > 0) { // 15%的概率修改随机商品价格
        const randomProduct = this.products[Math.floor(Math.random() * this.products.length)];
        const productId = randomProduct.id;
        const weeksUnchanged = this.marketModifiers.productUnchangedWeeks[productId] || 0;
        
        // 15%的概率随机调整，或者连续3周没变化
        if (productChangeChance < 0.15 || weeksUnchanged > 2) {
          // 偏向下跌的商品修正
          const productChange = (Math.random() * 0.4) - 0.25; // -25% to +15%，偏向下跌
          
          // 更新或创建商品修正
          this.marketModifiers.productModifiers[productId] = 
            Math.max(0.5, Math.min(1.5, (this.marketModifiers.productModifiers[productId] || 1) + productChange));
          
          // 重置未变化周数计数
          this.marketModifiers.productUnchangedWeeks[productId] = 0;
          
          console.log(`商品 ${productId} 价格修正更新为: ${this.marketModifiers.productModifiers[productId].toFixed(2)}`);
        } else {
          // 增加未变化周数计数
          this.marketModifiers.productUnchangedWeeks[productId] = weeksUnchanged + 1;
        }
      }
      
      // 随机清除一些过期的修正因子，但保留最近使用的
      Object.keys(this.marketModifiers.productModifiers).forEach(productId => {
        const weeksUnchanged = this.marketModifiers.productUnchangedWeeks[productId] || 0;
        // 如果超过5周未使用，或随机概率触发，则移除
        if (weeksUnchanged > 5 || Math.random() < 0.15) { // 15%的概率移除
          delete this.marketModifiers.productModifiers[productId];
          delete this.marketModifiers.productUnchangedWeeks[productId];
        }
      });
    },
    
    /**
     * 切换当前地点
     * @param {string} locationId - 地点ID
     * @returns {boolean} 是否切换成功
     */
    changeLocation(locationId) {
      // 在可用地点中查找
      const location = this.locations.find(loc => loc.id === locationId);
      if (!location) return false;
      
      // 更新当前地点
      this.currentLocation = location;
      
      // 更新该地点的商品
      this.updateLocationProducts();
      
      return true;
    },
    
    /**
     * 更新当前地点可用商品
     */
    updateLocationProducts() {
      console.log('MarketStore - 更新当前地点可用商品');
      
      if (!this.currentLocation) {
        console.warn('MarketStore - 更新可用商品失败: 当前地点未设置');
        this.availableProducts = [];
        return;
      }
      
      try {
        // 根据地点筛选可用商品
        const availableProductIds = this.getLocationAvailableProducts(this.currentLocation);
        console.log('MarketStore - 当前地点可用商品ID:', availableProductIds);
        
        // 更新可用商品列表
        this.availableProducts = this.products
          .filter(product => availableProductIds.includes(product.id))
          .map(product => {
            const currentPrice = this.getCurrentProductPrice(product.id);
            const isSpecial = this.isSpecialProduct(product.id);
            
            // 强制重新计算长期趋势和变化百分比
            const { trend, changePercent } = this.calculateLongTermTrend(product.id, product.basePrice);
            
            // 更新存储的趋势和变化百分比
            if (this.productPrices[product.id]) {
              this.productPrices[product.id].trend = trend;
              this.productPrices[product.id].changePercent = changePercent;
            }
            
            console.log(`商品 ${product.name} - 价格: ${currentPrice}, 趋势: ${trend}, 变化百分比: ${changePercent}%`);
            
            return {
              ...product,
              currentPrice,
              trend,
              changePercent,
              isSpecial
            };
          });
        
        console.log(`MarketStore - 更新完成，可用商品数量: ${this.availableProducts.length}`);
      } catch (error) {
        handleError(error, 'marketState (market)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
        console.error('MarketStore - 更新当前地点可用商品时出错:', error);
        // 确保即使出错也至少有一个空数组
        this.availableProducts = [];
      }
    },
    
    /**
     * 计算长期趋势和变化百分比
     * @param {number} productId - 商品ID
     * @param {number} basePrice - 商品基础价格
     * @returns {Object} 趋势和变化百分比
     */
    calculateLongTermTrend(productId, basePrice) {
      const priceData = this.productPrices[productId];
      if (!priceData || !priceData.history || priceData.history.length === 0) {
        console.log(`商品 ${productId} 没有价格历史数据，使用默认趋势`);
        return { trend: PriceTrend.STABLE, changePercent: 0 };
      }
      
      // 获取价格历史
      const priceHistory = priceData.history;
      
      // 计算当前价格相对于基础价格的变化百分比
      const currentPrice = priceHistory[priceHistory.length - 1];
      const currentChangePercent = ((currentPrice - basePrice) / basePrice) * 100;
      
      console.log(`商品 ${productId} 趋势计算 - 基础价格: ${basePrice}, 当前价格: ${currentPrice}, 历史记录: [${priceHistory.join(', ')}], 变化百分比: ${currentChangePercent.toFixed(1)}%`);
      
      // 计算价格变化趋势
      let trend;
      
      // 根据当前价格相对于基础价格的变化百分比确定趋势
      if (currentChangePercent > 15) {
        trend = PriceTrend.RISING_STRONG;
      } else if (currentChangePercent > 5) {
        trend = PriceTrend.RISING;
      } else if (currentChangePercent < -15) {
        trend = PriceTrend.FALLING_STRONG;
      } else if (currentChangePercent < -5) {
        trend = PriceTrend.FALLING;
      } else {
        // 对于小幅变化，根据价格在最低价和最高价之间的位置确定趋势
        const product = this.products.find(p => p.id === Number(productId));
        if (!product) {
          console.log(`商品 ${productId} 未找到产品信息，使用默认趋势`);
          trend = PriceTrend.STABLE;
        } else {
          const minPrice = product.minPrice;
          const maxPrice = product.maxPrice;
          const priceRange = maxPrice - minPrice;
          
          if (priceRange <= 0) {
            console.log(`商品 ${productId} 价格范围为0，使用默认趋势`);
            trend = PriceTrend.STABLE;
          } else {
            const relativePricePos = (currentPrice - minPrice) / priceRange;
            
            console.log(`商品 ${productId} 相对位置计算 - 最低价: ${minPrice}, 最高价: ${maxPrice}, 相对位置: ${(relativePricePos * 100).toFixed(1)}%`);
            
            if (relativePricePos > 0.8) {
              trend = PriceTrend.STABLE_HIGH;
            } else if (relativePricePos < 0.2) {
              trend = PriceTrend.STABLE_LOW;
            } else {
              trend = PriceTrend.STABLE;
            }
          }
        }
      }
      
      // 如果价格历史足够长，计算短期波动性
      if (priceHistory.length >= 3) {
        const recentPrices = priceHistory.slice(-3);
        const volatility = this.calculateVolatility(recentPrices);
        
        console.log(`商品 ${productId} 波动性计算 - 最近价格: [${recentPrices.join(', ')}], 波动性: ${volatility.toFixed(3)}`);
        
        // 如果波动性很高，将趋势标记为波动
        if (volatility > 0.1) {
          trend = PriceTrend.VOLATILE;
        }
      }
      
      console.log(`商品 ${productId} 最终趋势: ${trend}, 变化百分比: ${currentChangePercent.toFixed(1)}%`);
      
      return {
        trend,
        changePercent: parseFloat(currentChangePercent.toFixed(1))
      };
    },
    
    /**
     * 计算价格波动性
     * @param {Array} prices - 价格数组
     * @returns {number} 波动性指标
     */
    calculateVolatility(prices) {
      if (!prices || prices.length < 2) return 0;
      
      let sumChanges = 0;
      for (let i = 1; i < prices.length; i++) {
        const prevPrice = prices[i-1];
        const currentPrice = prices[i];
        if (prevPrice > 0) {
          const change = Math.abs((currentPrice - prevPrice) / prevPrice);
          sumChanges += change;
        }
      }
      
      return sumChanges / (prices.length - 1);
    },
    
    /**
     * 获取地点可用商品列表
     * @param {Object} location - 地点对象
     * @returns {Array} 可用商品ID列表
     */
    getLocationAvailableProducts(location) {
      if (!location) return [];
      
      try {
        // 获取此地点可用的商品ID
        const availableProducts = this.products
          .filter(product => {
            // 检查产品是否在当前地点可用
            return product.availableAt && product.availableAt.includes(location.id);
          })
          .map(product => product.id);
        
        // 添加特色商品，确保它们也在可用列表中
        if (location.specialProducts && location.specialProducts.length > 0) {
          location.specialProducts.forEach(productId => {
            if (!availableProducts.includes(productId)) {
              availableProducts.push(productId);
            }
          });
        }
        
        return availableProducts;
      } catch (error) {
        console.error('获取地点可用商品列表出错:', error);
        return [];
      }
    },
    
    /**
     * 判断商品是否为当前地点特色商品
     * @param {string} productId - 商品ID
     * @returns {boolean} 是否为特色商品
     */
    isSpecialProduct(productId) {
      if (!this.currentLocation || !this.currentLocation.specialProducts) {
        return false;
      }
      
      return this.currentLocation.specialProducts.includes(productId);
    },
    
    /**
     * 获取商品当前价格
     * @param {string} productId - 商品ID
     * @returns {number} 商品当前价格
     */
    getCurrentProductPrice(productId) {
      if (!productId) {
        console.warn('MarketStore - getCurrentProductPrice: 找不到商品价格 (ID: ${productId})');
        
        // 尝试查找商品的基础价格
        const product = this.products.find(p => p.id === productId);
        if (product) {
          console.log(`MarketStore - 使用商品基础价格: ${product.basePrice}`);
          return product.basePrice || 0;
        }
        
        return 0;
      }
      
      // 检查价格是否存在
      if (!this.productPrices || !this.productPrices[productId]) {
        console.warn(`MarketStore - getCurrentProductPrice: 找不到商品价格 (ID: ${productId})`);
        
        // 尝试查找商品的基础价格
        const product = this.products.find(p => p.id === productId);
        if (product) {
          console.log(`MarketStore - 使用商品基础价格: ${product.basePrice}`);
          return product.basePrice || 0;
        }
        
        return 0;
      }
      
      return this.productPrices[productId].price;
    },
    
    /**
     * 获取商品价格历史
     * @param {string} productId - 商品ID
     * @returns {Array} 价格历史
     */
    getProductPriceHistory(productId) {
      return this.productPrices[productId]?.history || [];
    },
    
    /**
     * 获取商品价格趋势
     * @param {string} productId - 商品ID
     * @returns {string} 价格趋势
     */
    getProductPriceTrend(productId) {
      return this.productPrices[productId]?.trend || PriceTrend.STABLE;
    },
    
    /**
     * 添加市场修正因子
     * @param {string} type - 修正类型 ('global', 'category', 'product')
     * @param {Object} data - 修正数据
     */
    addMarketModifier(type, data) {
      switch (type) {
        case 'global':
          this.marketModifiers.globalPriceModifier = data.value;
          break;
          
        case 'category':
          this.marketModifiers.categoryModifiers[data.category] = data.value;
          break;
          
        case 'product':
          this.marketModifiers.productModifiers[data.productId] = data.value;
          break;
      }
    },

/**
 * 加载产品数据
 * @param {Array} productIds - 产品ID列表
 */
loadProducts(productIds) {
  console.log('MarketStore - 加载产品数据:', productIds);
  if (!Array.isArray(productIds)) {
    console.warn('MarketStore - 加载产品数据时传入的不是数组:', productIds);
    return;
  }
  
  // 确保产品列表已加载
  if (this.products.length === 0) {
    this.products = getAllProducts();
  }
  
  // 如果传入的是产品ID列表，过滤出对应产品
  if (productIds.length > 0 && typeof productIds[0] === 'string') {
    const allProducts = getAllProducts();
    this.products = allProducts.filter(p => productIds.includes(p.id));
    console.log('MarketStore - 已加载指定产品:', this.products.length);
  }
  
  // 更新当前地点的可用产品
  this.updateLocationProducts();
},

/**
 * 加载房屋数据
 * @param {Array} houseIds - 房屋ID列表
 */
loadHouses(houseIds) {
  console.log('MarketStore - 加载房屋数据:', houseIds);
  if (!Array.isArray(houseIds)) {
    console.warn('MarketStore - 加载房屋数据时传入的不是数组:', houseIds);
    return;
  }
  
  // 确保房屋列表已加载
  if (this.houses.length === 0) {
    this.houses = getAllHouses();
  }
  
  // 如果传入的是房屋ID列表，过滤出对应房屋
  if (houseIds.length > 0 && typeof houseIds[0] === 'string') {
    const allHouses = getAllHouses();
    this.houses = allHouses.filter(h => houseIds.includes(h.id));
    console.log('MarketStore - 已加载指定房屋:', this.houses.length);
  }
},
  },
  
  getters: {
    /**
     * 获取可购买的房屋列表
     * @returns {Array} 可购买的房屋
     */
    availableHouses(state) {
      return state.houses;
    },
    
    /**
     * 获取当前地点信息
     * @returns {Object} 当前地点
     */
    currentLocationInfo(state) {
      if (!state.currentLocation) return null;
      
      return {
        id: state.currentLocation.id,
        name: state.currentLocation.name,
        description: state.currentLocation.description,
        modifiers: state.currentLocation.modifiers,
        hasSpecialProducts: 
          state.currentLocation.specialProducts && 
          state.currentLocation.specialProducts.length > 0
      };
    },
    
    /**
     * 获取市场状态信息
     * @returns {Object} 市场状态
     */
    marketStatus(state) {
      // 判断市场整体状态
      const globalModifier = state.marketModifiers.globalPriceModifier;
      let status = 'neutral';
      
      if (globalModifier > 1.1) status = 'bull';
      else if (globalModifier < 0.9) status = 'bear';
      
      // 计算高价和低价商品占比
      const productsWithPrices = state.products.filter(p => state.productPrices[p.id]);
      const highPriceProducts = productsWithPrices.filter(p => {
        const priceData = state.productPrices[p.id];
        const pricePosition = (priceData.price - p.minPrice) / (p.maxPrice - p.minPrice);
        return pricePosition > 0.7;
      });
      
      const lowPriceProducts = productsWithPrices.filter(p => {
        const priceData = state.productPrices[p.id];
        const pricePosition = (priceData.price - p.minPrice) / (p.maxPrice - p.minPrice);
        return pricePosition < 0.3;
      });
      
      return {
        status,
        globalModifier,
        highPriceProductsRatio: productsWithPrices.length > 0 ? 
          highPriceProducts.length / productsWithPrices.length : 0,
        lowPriceProductsRatio: productsWithPrices.length > 0 ? 
          lowPriceProducts.length / productsWithPrices.length : 0,
        activeModifiersCount: 
          Object.keys(state.marketModifiers.categoryModifiers).length + 
          Object.keys(state.marketModifiers.productModifiers).length
      };
    }
  }
}); 