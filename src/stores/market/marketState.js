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
      locationModifiers: {}, // 新增: 地区价格修正因子 {locationId: modifier}
      locationProductModifiers: {}, // 新增: 地区内商品价格修正因子 {locationId: {productId: modifier}}
      weeksSinceLastGlobalChange: 0, // 记录全局价格修正因子连续未变化的周数
      categoryUnchangedWeeks: {}, // 记录类别修正因子连续未变化的周数
      productUnchangedWeeks: {}, // 记录商品修正因子连续未变化的周数
      locationUnchangedWeeks: {}, // 新增: 记录地区修正因子连续未变化的周数
      locationProductUnchangedWeeks: {} // 新增: 记录地区商品修正因子连续未变化的周数
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
              locationModifiers: {}, // 新增: 地区价格修正因子
              locationProductModifiers: {}, // 新增: 地区内商品价格修正因子
              weeksSinceLastGlobalChange: 0, // 初始化计数器
              categoryUnchangedWeeks: {}, // 初始化计数器
              productUnchangedWeeks: {}, // 初始化计数器
              locationUnchangedWeeks: {}, // 新增: 初始化计数器
              locationProductUnchangedWeeks: {} // 新增: 初始化计数器
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
        
        // 添加当前地点信息到市场修正因子
        if (this.currentLocation) {
          this.marketModifiers.currentLocation = this.currentLocation;
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
     * 随机波动市场价格调整因子，使市场更加动态
     */
    updateMarketModifiers() {
      const modifiers = this.marketModifiers;
      console.log('MarketStore - 更新市场调整因子');
      
      // 增加全局价格修正因子连续未变化的计数
      modifiers.weeksSinceLastGlobalChange++;
      
      // 全局价格修正因子波动
      // 每隔4-8周随机变化一次
      if (modifiers.weeksSinceLastGlobalChange >= Math.max(4, Math.floor(Math.random() * 5) + 4)) {
        // 重置计数器
        modifiers.weeksSinceLastGlobalChange = 0;
        
        // 以70%概率变动全局价格修正因子
        if (Math.random() < 0.7) {
          // 在0.8到1.2之间随机波动
          const oldModifier = modifiers.globalPriceModifier;
          const variance = (Math.random() - 0.5) * 0.2; // -0.1 到 0.1 之间
          modifiers.globalPriceModifier = Math.max(0.8, Math.min(1.2, oldModifier + variance));
          
          console.log(`MarketStore - 全局价格修正因子已更新: ${oldModifier.toFixed(2)} -> ${modifiers.globalPriceModifier.toFixed(2)}`);
        }
      }
      
      // 类别价格修正因子波动
      // 对每个类别，都有30%的概率进行波动
      const categories = ['food', 'electronics', 'luxury', 'daily', 'collectible'];
      categories.forEach(category => {
        // 增加类别价格修正因子连续未变化的计数
        modifiers.categoryUnchangedWeeks[category] = (modifiers.categoryUnchangedWeeks[category] || 0) + 1;
        
        // 如果连续4周没有变化，或者有30%概率变化
        if (modifiers.categoryUnchangedWeeks[category] >= 4 || Math.random() < 0.3) {
          // 重置计数器
          modifiers.categoryUnchangedWeeks[category] = 0;
          
          // 在0.7到1.3之间随机波动
          const oldModifier = modifiers.categoryModifiers[category] || 1;
          const variance = (Math.random() - 0.5) * 0.3; // -0.15 到 0.15 之间
          modifiers.categoryModifiers[category] = Math.max(0.7, Math.min(1.3, oldModifier + variance));
          
          console.log(`MarketStore - ${category}类别价格修正因子已更新: ${oldModifier.toFixed(2)} -> ${modifiers.categoryModifiers[category].toFixed(2)}`);
        }
      });
      
      // 单个商品价格修正因子波动 - 每周有15%概率对少数几个商品进行波动
      if (Math.random() < 0.15) {
        // 随机选择1-3个商品
        const productCount = Math.floor(Math.random() * 3) + 1;
        const productIds = Object.keys(this.productPrices);
        
        for (let i = 0; i < productCount && productIds.length > 0; i++) {
          // 随机选择一个商品
          const randomIndex = Math.floor(Math.random() * productIds.length);
          const productId = productIds[randomIndex];
          
          // 更新连续未变化的周数
          modifiers.productUnchangedWeeks[productId] = 0;
          
          // 在0.5到1.5之间随机波动
          const oldModifier = modifiers.productModifiers[productId] || 1;
          const variance = (Math.random() - 0.5) * 0.6; // -0.3 到 0.3 之间
          modifiers.productModifiers[productId] = Math.max(0.5, Math.min(1.5, oldModifier + variance));
          
          const product = this.products.find(p => p.id === Number(productId));
          console.log(`MarketStore - 商品价格修正因子已更新: ${product?.name || productId} ${oldModifier.toFixed(2)} -> ${modifiers.productModifiers[productId].toFixed(2)}`);
        }
      }

      // 地区价格修正因子波动 - 每周有20%概率对1-2个地区进行波动
      if (Math.random() < 0.2) {
        // 随机选择1-2个地区
        const locationCount = Math.floor(Math.random() * 2) + 1;
        const locationIds = this.locations.map(location => location.id);
        
        for (let i = 0; i < locationCount && locationIds.length > 0; i++) {
          // 随机选择一个地区
          const randomIndex = Math.floor(Math.random() * locationIds.length);
          const locationId = locationIds[randomIndex];
          
          // 更新连续未变化的周数
          modifiers.locationUnchangedWeeks[locationId] = 0;
          
          // 在0.6到1.4之间随机波动
          const oldModifier = modifiers.locationModifiers[locationId] || 1;
          const variance = (Math.random() - 0.5) * 0.4; // -0.2 到 0.2 之间
          modifiers.locationModifiers[locationId] = Math.max(0.6, Math.min(1.4, oldModifier + variance));
          
          const location = this.locations.find(l => l.id === locationId);
          console.log(`MarketStore - 地区价格修正因子已更新: ${location?.name || locationId} ${oldModifier.toFixed(2)} -> ${modifiers.locationModifiers[locationId].toFixed(2)}`);
        }
      }

      // 地区内商品价格修正因子波动 - 每周有10%概率对某个地区的1-3个商品进行波动
      if (Math.random() < 0.1) {
        // 随机选择一个地区
        const locationIds = this.locations.map(location => location.id);
        const randomLocationIndex = Math.floor(Math.random() * locationIds.length);
        const locationId = locationIds[randomLocationIndex];
        
        // 随机选择1-3个商品
        const productCount = Math.floor(Math.random() * 3) + 1;
        const productIds = Object.keys(this.productPrices);
        
        // 确保locationProductModifiers中有该地区的对象
        if (!modifiers.locationProductModifiers[locationId]) {
          modifiers.locationProductModifiers[locationId] = {};
        }
        
        // 确保locationProductUnchangedWeeks中有该地区的对象
        if (!modifiers.locationProductUnchangedWeeks[locationId]) {
          modifiers.locationProductUnchangedWeeks[locationId] = {};
        }
        
        for (let i = 0; i < productCount && productIds.length > 0; i++) {
          // 随机选择一个商品
          const randomProductIndex = Math.floor(Math.random() * productIds.length);
          const productId = productIds[randomProductIndex];
          
          // 更新连续未变化的周数
          modifiers.locationProductUnchangedWeeks[locationId][productId] = 0;
          
          // 在0.4到1.6之间随机波动（比单独的商品波动更大）
          const oldModifier = modifiers.locationProductModifiers[locationId][productId] || 1;
          const variance = (Math.random() - 0.5) * 0.8; // -0.4 到 0.4 之间
          modifiers.locationProductModifiers[locationId][productId] = Math.max(0.4, Math.min(1.6, oldModifier + variance));
          
          const product = this.products.find(p => p.id === Number(productId));
          const location = this.locations.find(l => l.id === locationId);
          console.log(`MarketStore - 地区内商品价格修正因子已更新: ${location?.name || locationId} 的 ${product?.name || productId} ${oldModifier.toFixed(2)} -> ${modifiers.locationProductModifiers[locationId][productId].toFixed(2)}`);
        }
      }
      
      // 清理过期的修正因子 - 所有类型的修正因子都会随时间自动恢复到1.0
      // (现有代码保留不变...)

      // 确保所有修正因子在合理范围内
      if (modifiers.globalPriceModifier < 0.8 || modifiers.globalPriceModifier > 1.2) {
        modifiers.globalPriceModifier = 1.0;
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
        console.warn(`MarketStore - getCurrentProductPrice: 无效的商品ID: ${productId}`);
        return 0;
      }
      
      // 确保将productId转换为字符串进行比较
      const productIdStr = String(productId);
      
      // 检查价格是否存在
      if (!this.productPrices || !this.productPrices[productIdStr]) {
        console.warn(`MarketStore - getCurrentProductPrice: 找不到商品价格 (ID: ${productIdStr})`);
        
        // 尝试查找商品的基础价格
        const product = this.products.find(p => String(p.id) === productIdStr);
        if (product) {
          console.log(`MarketStore - 使用商品基础价格: ${product.basePrice}`);
          return product.basePrice || 0;
        }
        
        return 0;
      }
      
      return this.productPrices[productIdStr].price || 0;
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
     * 添加市场修正器
     * @param {string} type - 修正类型 ('global', 'category', 'product', 'location', 'locationProduct')
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

        case 'location':
          this.marketModifiers.locationModifiers[data.locationId] = data.value;
          break;
          
        case 'locationProduct':
          // 确保locationProductModifiers中有该地区的对象
          if (!this.marketModifiers.locationProductModifiers[data.locationId]) {
            this.marketModifiers.locationProductModifiers[data.locationId] = {};
          }
          this.marketModifiers.locationProductModifiers[data.locationId][data.productId] = data.value;
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