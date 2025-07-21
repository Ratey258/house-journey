/**
 * 市场仓储
 * 负责市场数据的存取
 */
import { getAllLocations, getLocationById as getCoreLocationById } from '../../core/models/location';
import { withErrorHandling } from '@/infrastructure/utils/errorHandler';
import { ErrorType } from '@/infrastructure/utils/errorTypes';
import storageService from './storageService';

/**
 * 市场仓储类
 */
export class MarketRepository {
  /**
   * 构造函数
   * @param {Object} storageService 存储服务
   */
  constructor(storageService) {
    this.storageService = storageService;
    this.priceHistoryKey = 'price_history';
    this.currentLocationKey = 'current_location';
    this.locationProductsKey = 'location_products';
    this.marketModifiersKey = 'market_modifiers';
    this._cachedLocations = null;
    this._cachedPriceHistory = null;
    this._cachedCurrentLocation = null;
    this._cachedLocationProducts = null;
    this._cachedMarketModifiers = null;
  }
  
  /**
   * 获取所有地点
   * @returns {Promise<Array>} 地点列表
   */
  async getAllLocations() {
    return withErrorHandling(async () => {
      if (this._cachedLocations) {
        return this._cachedLocations;
      }
      
      const locations = getAllLocations();
      this._cachedLocations = locations;
      return locations;
    }, 'MarketRepository.getAllLocations', ErrorType.STORAGE);
  }
  
  /**
   * 根据ID获取地点
   * @param {string} id 地点ID
   * @returns {Promise<Object|null>} 地点对象或null
   */
  async getLocationById(id) {
    return withErrorHandling(async () => {
      return getCoreLocationById(id);
    }, 'MarketRepository.getLocationById', ErrorType.STORAGE);
  }
  
  /**
   * 获取价格历史
   * @returns {Promise<Object>} 价格历史对象
   */
  async getAllPrices() {
    return withErrorHandling(async () => {
      if (this._cachedPriceHistory) {
        return this._cachedPriceHistory;
      }
      
      const data = await this.storageService.getData(this.priceHistoryKey);
      this._cachedPriceHistory = data || {};
      return this._cachedPriceHistory;
    }, 'MarketRepository.getAllPrices', ErrorType.STORAGE);
  }
  
  /**
   * 获取当前价格
   * @param {string} productId 产品ID
   * @returns {Promise<Object|null>} 价格对象或null
   */
  async getCurrentPrice(productId) {
    return withErrorHandling(async () => {
      const priceHistory = await this.getAllPrices();
      return priceHistory[productId] || null;
    }, 'MarketRepository.getCurrentPrice', ErrorType.STORAGE);
  }
  
  /**
   * 更新价格
   * @param {Object} prices 价格对象
   * @returns {Promise<boolean>} 操作是否成功
   */
  async updatePrices(prices) {
    return withErrorHandling(async () => {
      const priceHistory = await this.getAllPrices();
      
      // 合并价格
      const updatedPrices = {
        ...priceHistory,
        ...prices
      };
      
      // 对每个价格添加历史记录
      Object.keys(updatedPrices).forEach(productId => {
        const currentData = updatedPrices[productId];
        const prevData = priceHistory[productId];
        
        if (prevData) {
          // 更新历史记录
          updatedPrices[productId] = {
            ...currentData,
            prevPrice: prevData.price,
            history: [...(prevData.history || []), currentData.price].slice(-10)
          };
        } else {
          // 新产品，创建历史记录
          updatedPrices[productId] = {
            ...currentData,
            prevPrice: currentData.price,
            history: [currentData.price]
          };
        }
      });
      
      await this.storageService.setData(this.priceHistoryKey, updatedPrices);
      this._cachedPriceHistory = updatedPrices;
      return true;
    }, 'MarketRepository.updatePrices', ErrorType.STORAGE);
  }
  
  /**
   * 获取当前地点
   * @returns {Promise<Object|null>} 当前地点对象或null
   */
  async getCurrentLocation() {
    return withErrorHandling(async () => {
      if (this._cachedCurrentLocation) {
        return this._cachedCurrentLocation;
      }
      
      const locationId = await this.storageService.getData(this.currentLocationKey);
      if (!locationId) {
        return null;
      }
      
      const location = await this.getLocationById(locationId);
      this._cachedCurrentLocation = location;
      return location;
    }, 'MarketRepository.getCurrentLocation', ErrorType.STORAGE);
  }
  
  /**
   * 设置当前地点
   * @param {string} locationId 地点ID
   * @returns {Promise<boolean>} 操作是否成功
   */
  async setCurrentLocation(locationId) {
    return withErrorHandling(async () => {
      await this.storageService.setData(this.currentLocationKey, locationId);
      this._cachedCurrentLocation = null;
      return true;
    }, 'MarketRepository.setCurrentLocation', ErrorType.STORAGE);
  }
  
  /**
   * 获取地点可用产品
   * @param {string} locationId 地点ID
   * @returns {Promise<Array>} 可用产品列表
   */
  async getLocationProducts(locationId) {
    return withErrorHandling(async () => {
      if (this._cachedLocationProducts && this._cachedLocationProducts[locationId]) {
        return this._cachedLocationProducts[locationId];
      }
      
      const allLocationProducts = await this.storageService.getData(this.locationProductsKey) || {};
      const products = allLocationProducts[locationId] || [];
      
      if (!this._cachedLocationProducts) {
        this._cachedLocationProducts = {};
      }
      this._cachedLocationProducts[locationId] = products;
      
      return products;
    }, 'MarketRepository.getLocationProducts', ErrorType.STORAGE);
  }
  
  /**
   * 更新地点可用产品
   * @param {string} locationId 地点ID
   * @param {Array} products 可用产品列表
   * @returns {Promise<boolean>} 操作是否成功
   */
  async updateLocationProducts(locationId, products) {
    return withErrorHandling(async () => {
      const allLocationProducts = await this.storageService.getData(this.locationProductsKey) || {};
      
      allLocationProducts[locationId] = products;
      
      await this.storageService.setData(this.locationProductsKey, allLocationProducts);
      
      if (!this._cachedLocationProducts) {
        this._cachedLocationProducts = {};
      }
      this._cachedLocationProducts[locationId] = products;
      
      return true;
    }, 'MarketRepository.updateLocationProducts', ErrorType.STORAGE);
  }
  
  /**
   * 获取市场修正因子
   * @returns {Promise<Object>} 市场修正因子对象
   */
  async getMarketModifiers() {
    return withErrorHandling(async () => {
      if (this._cachedMarketModifiers) {
        return this._cachedMarketModifiers;
      }
      
      const modifiers = await this.storageService.getData(this.marketModifiersKey) || {
        globalPriceModifier: 1,
        categoryModifiers: {},
        productModifiers: {}
      };
      
      this._cachedMarketModifiers = modifiers;
      return modifiers;
    }, 'MarketRepository.getMarketModifiers', ErrorType.STORAGE);
  }
  
  /**
   * 更新市场修正因子
   * @param {Object} modifiers 市场修正因子对象
   * @returns {Promise<boolean>} 操作是否成功
   */
  async updateMarketModifiers(modifiers) {
    return withErrorHandling(async () => {
      await this.storageService.setData(this.marketModifiersKey, modifiers);
      this._cachedMarketModifiers = modifiers;
      return true;
    }, 'MarketRepository.updateMarketModifiers', ErrorType.STORAGE);
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this._cachedLocations = null;
    this._cachedPriceHistory = null;
    this._cachedCurrentLocation = null;
    this._cachedLocationProducts = null;
    this._cachedMarketModifiers = null;
  }
}

// 创建默认实例
const marketRepository = new MarketRepository(storageService);

export default marketRepository; 