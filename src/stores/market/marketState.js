import { defineStore } from 'pinia';
import { getAllProducts } from '../../core/models/product';
import { getAllLocations } from '../../core/models/location';
import { getAllHouses } from '../../core/models/house';
import { PriceTrend } from '../../core/services/priceSystem';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';
import { usePriceSystemStore } from './priceSystemStore';

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
            
            // 初始化价格 - 使用priceSystemStore
            try {
              const priceSystem = usePriceSystemStore();
              
              // 确保价格系统已初始化
              priceSystem.initializePriceSystem();
              
              // 为每个产品设置初始价格
              this.products.forEach(product => {
                // 初始价格设置在最低价和最高价之间的随机值
                const initialPrice = Math.floor(Math.random() * (product.maxPrice - product.minPrice) + product.minPrice);
                
                // 确保productId是字符串类型
                const productId = String(product.id);
                
                // 在priceSystem中设置初始价格
                if (!priceSystem.productPrices[productId]) {
                  priceSystem.productPrices[productId] = {
                    price: initialPrice,
                    trend: 0, // 初始趋势为0（稳定）
                    history: [],
                    changePercent: 0
                  };
                }
                
                // 更新价格历史
                priceSystem.updatePriceHistory(productId, initialPrice, 1);
              });
              
              console.log('MarketStore - 价格系统初始化完成，产品数量:', this.products.length);
            } catch (error) {
              console.error('MarketStore - 初始化价格系统失败:', error);
            }
            
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
     * 更新市场状态
     * @param {number} currentWeek - 当前周数
     */
    updateMarketState(currentWeek) {
      console.log('MarketStore - 更新市场状态, 当前周数:', currentWeek);
      
      // 更新市场修正因子
      this.updateMarketModifiers();
      
      try {
        // 导入并使用priceSystemStore
        const priceSystem = usePriceSystemStore();
        
        // 更新商品价格
        priceSystem.updatePrices(currentWeek, this.products);
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
      try {
        // 使用priceSystemStore
        const priceSystem = usePriceSystemStore();
        
        // 添加市场平衡机制，避免极端情况连续出现
        const productTrends = Object.values(priceSystem.productPrices || {}).map(p => p?.trend || 0);
        const risingCount = productTrends.filter(t => t > 0.1).length; // 上涨趋势
        const fallingCount = productTrends.filter(t => t < -0.1).length; // 下跌趋势
        const totalProducts = productTrends.length || 1;
        
        // 计算上涨和下跌的比例
        const risingRatio = risingCount / totalProducts;
        const fallingRatio = fallingCount / totalProducts;
        
        // 检测是否处于极端市场状态
        const isExtremeBullMarket = risingRatio > 0.7; // 超过70%的商品上涨
        const isExtremeBearMarket = fallingRatio > 0.7; // 超过70%的商品下跌
        
        console.log(`市场状态检测 - 上涨比例: ${(risingRatio * 100).toFixed(1)}%, 下跌比例: ${(fallingRatio * 100).toFixed(1)}%`);
        
        // 全局价格修正
        let globalChangeAmount;
        if (isExtremeBullMarket) {
          // 如果市场过热，增加下跌概率和幅度
          globalChangeAmount = (Math.random() * 0.15) - 0.12; // -12% to +3%，强烈偏向下跌
          console.log('市场过热，触发平衡机制，价格调整偏向下跌');
        } else if (isExtremeBearMarket) {
          // 如果市场过冷，增加上涨概率和幅度
          globalChangeAmount = (Math.random() * 0.15) - 0.03; // -3% to +12%，强烈偏向上涨
          console.log('市场过冷，触发平衡机制，价格调整偏向上涨');
        } else {
          // 正常市场状态，维持略微偏向下跌的调整
          globalChangeAmount = (Math.random() * 0.15) - 0.1; // -10% to +5%，偏向下跌
        }
        
        // 更新全局修正因子
        const newGlobalModifier = Math.max(0.7, Math.min(1.3, (priceSystem.marketModifiers.global || 1) + globalChangeAmount));
        priceSystem.setMarketModifier('global', null, newGlobalModifier);
        
        // 随机更新类别修正
        const categories = ['FOOD', 'ELECTRONICS', 'LUXURY', 'DAILY', 'COLLECTIBLE'];
        
        // 为每个类别随机更新修正因子
        categories.forEach(category => {
          if (Math.random() < 0.3) { // 30%的概率随机调整
            // 获取该类别商品的趋势
            const categoryProducts = this.products.filter(p => p.category === category);
            const categoryProductIds = categoryProducts.map(p => String(p.id));
            const categoryTrends = categoryProductIds
              .map(id => priceSystem.productPrices[id]?.trend || 0)
              .filter(trend => typeof trend === 'number');
            
            const catRisingCount = categoryTrends.filter(t => t > 0.1).length;
            const catFallingCount = categoryTrends.filter(t => t < -0.1).length;
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
            
            // 更新类别修正
            const currentModifier = priceSystem.marketModifiers.categories[category] || 1;
            const newModifier = Math.max(0.6, Math.min(1.4, currentModifier + categoryChange));
            priceSystem.setMarketModifier('category', category, newModifier);
            
            console.log(`类别 ${category} 价格修正更新为: ${newModifier.toFixed(2)}`);
          }
        });
        
        // 随机为单个商品添加特殊修正
        const productCount = this.products.length;
        if (productCount > 0 && Math.random() < 0.15) { // 15%的概率修改随机商品价格
          const randomProduct = this.products[Math.floor(Math.random() * this.products.length)];
          const productId = String(randomProduct.id);
          
          // 偏向下跌的商品修正
          const productChange = (Math.random() * 0.4) - 0.25; // -25% to +15%，偏向下跌
          
          // 更新商品修正
          const currentModifier = priceSystem.marketModifiers.products[productId] || 1;
          const newModifier = Math.max(0.5, Math.min(1.5, currentModifier + productChange));
          priceSystem.setMarketModifier('product', productId, newModifier);
          
          console.log(`商品 ${productId} 价格修正更新为: ${newModifier.toFixed(2)}`);
        }
        
        // 如果市场整体上涨，选择一些商品下跌
        if (isExtremeBullMarket && productCount > 0) {
          const counterTrendCount = Math.max(2, Math.floor(productCount * 0.1));
          for (let i = 0; i < counterTrendCount; i++) {
            const randomIndex = Math.floor(Math.random() * productCount);
            const randomProduct = this.products[randomIndex];
            if (randomProduct) {
              // 强制下跌修正
              priceSystem.setMarketModifier('product', String(randomProduct.id), 0.7); // 30%的下跌修正
            }
          }
          console.log(`市场过热，为${counterTrendCount}个商品添加下跌修正`);
        } 
        // 如果市场整体下跌，选择一些商品上涨
        else if (isExtremeBearMarket && productCount > 0) {
          const counterTrendCount = Math.max(2, Math.floor(productCount * 0.1));
          for (let i = 0; i < counterTrendCount; i++) {
            const randomIndex = Math.floor(Math.random() * productCount);
            const randomProduct = this.products[randomIndex];
            if (randomProduct) {
              // 强制上涨修正
              priceSystem.setMarketModifier('product', String(randomProduct.id), 1.3); // 30%的上涨修正
            }
          }
          console.log(`市场过冷，为${counterTrendCount}个商品添加上涨修正`);
        }
      } catch (error) {
        console.error('MarketStore - 更新市场修正因子时出错:', error);
      }
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
        // 导入并使用priceSystemStore
        const priceSystem = usePriceSystemStore();
        
        // 根据地点筛选可用商品
        const availableProductIds = this.getLocationAvailableProducts(this.currentLocation);
        console.log('MarketStore - 当前地点可用商品ID:', availableProductIds);
        
        // 更新可用商品列表
        this.availableProducts = this.products
          .filter(product => availableProductIds.includes(product.id))
          .map(product => {
            // 确保productId是字符串类型
            const productId = String(product.id);
            
            // 从priceSystem获取价格
            const priceData = priceSystem.productPrices[productId];
            const currentPrice = priceData?.price || product.basePrice;
            
            // 获取趋势信息
            const trendInfo = priceSystem.getProductPriceTrend(productId);
            const trend = trendInfo.trend || 'stable';
            
            // 计算变化百分比（相对于基础价格）
            const changePercent = ((currentPrice - product.basePrice) / product.basePrice) * 100;
            
            // 检查是否为特色商品
            const isSpecial = this.isSpecialProduct(product.id);
            
            console.log(`商品 ${product.name} - 价格: ${currentPrice}, 趋势: ${trend}, 变化百分比: ${changePercent.toFixed(1)}%`);
            
            return {
              ...product,
              currentPrice,
              trend,
              changePercent: parseFloat(changePercent.toFixed(1)),
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
     * 获取商品价格历史
     * @param {string} productId - 商品ID
     * @returns {Array} 价格历史
     */
    getProductPriceHistory(productId) {
      // 使用priceSystemStore获取价格历史
      const priceSystem = usePriceSystemStore();
      return priceSystem.priceHistory[productId] || [];
    },
    
    /**
     * 获取商品价格趋势
     * @param {string} productId - 商品ID
     * @returns {string} 价格趋势
     */
    getProductPriceTrend(productId) {
      // 使用priceSystemStore获取价格趋势
      const priceSystem = usePriceSystemStore();
      return priceSystem.getProductPriceTrend(productId).trend || 'stable';
    },
    
    /**
     * 获取商品当前价格
     * @param {string} productId - 商品ID
     * @returns {number} 商品当前价格
     */
    getCurrentProductPrice(productId) {
      if (!productId) {
        console.warn(`MarketStore - getCurrentProductPrice: 无效的商品ID`);
        return 0;
      }
      
      try {
        // 使用priceSystemStore获取价格
        const priceSystem = usePriceSystemStore();
        
        // 确保productId是字符串类型
        const productIdStr = String(productId);
        
        // 从priceSystem获取价格
        const priceData = priceSystem.productPrices[productIdStr];
        if (priceData && typeof priceData.price === 'number') {
          return priceData.price;
        }
        
        // 如果价格不存在，尝试获取商品基础价格
        const product = this.products.find(p => String(p.id) === productIdStr);
        if (product) {
          console.log(`MarketStore - 使用商品基础价格: ${product.basePrice}`);
          return product.basePrice || 0;
        }
        
        console.warn(`MarketStore - getCurrentProductPrice: 找不到商品价格 (ID: ${productId})`);
        return 0;
      } catch (error) {
        console.error(`MarketStore - getCurrentProductPrice出错:`, error);
        return 0;
      }
    },
    
    /**
     * 添加市场修正因子
     * @param {string} type - 修正类型 ('global', 'category', 'product')
     * @param {Object} data - 修正数据
     */
    addMarketModifier(type, data) {
      try {
        const priceSystem = usePriceSystemStore();
        
        switch (type) {
          case 'global':
            priceSystem.setMarketModifier('global', null, data.value);
            break;
            
          case 'category':
            priceSystem.setMarketModifier('category', data.category, data.value);
            break;
            
          case 'product':
            priceSystem.setMarketModifier('product', String(data.productId), data.value);
            break;
        }
      } catch (error) {
        console.error('MarketStore - 添加市场修正因子出错:', error);
      }
    }
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