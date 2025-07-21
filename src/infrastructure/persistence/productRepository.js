/**
 * 产品仓储
 * 负责产品数据的存取
 */
import { getAllProducts, getProductById as getCoreProductById } from '../../core/models/product';
import { withErrorHandling } from '@/infrastructure/utils/errorHandler';
import { ErrorType } from '@/infrastructure/utils/errorTypes';
import storageService from './storageService';

/**
 * 产品仓储类
 */
export class ProductRepository {
  /**
   * 构造函数
   * @param {Object} storageService 存储服务
   */
  constructor(storageService) {
    this.storageService = storageService;
    this.storageKey = 'custom_products';
    this._cachedProducts = null;
  }
  
  /**
   * 获取所有产品
   * @returns {Promise<Array>} 产品列表
   */
  async getAllProducts() {
    return withErrorHandling(async () => {
      if (this._cachedProducts) {
        return this._cachedProducts;
      }
      
      // 获取核心产品
      const coreProducts = getAllProducts();
      
      // 获取自定义产品
      const customProducts = await this.getCustomProducts();
      
      // 合并产品列表
      const allProducts = [...coreProducts];
      if (customProducts && customProducts.length > 0) {
        // 确保自定义产品不与核心产品ID冲突
        const coreIds = new Set(coreProducts.map(p => p.id));
        const validCustomProducts = customProducts.filter(p => !coreIds.has(p.id));
        allProducts.push(...validCustomProducts);
      }
      
      this._cachedProducts = allProducts;
      return allProducts;
    }, 'ProductRepository.getAllProducts', ErrorType.STORAGE);
  }
  
  /**
   * 根据ID获取产品
   * @param {string} id 产品ID
   * @returns {Promise<Object|null>} 产品对象或null
   */
  async getProductById(id) {
    return withErrorHandling(async () => {
      // 先查找核心产品
      const coreProduct = getCoreProductById(id);
      if (coreProduct) {
        return coreProduct;
      }
      
      // 查找自定义产品
      const customProducts = await this.getCustomProducts();
      return customProducts?.find(p => p.id === id) || null;
    }, 'ProductRepository.getProductById', ErrorType.STORAGE);
  }
  
  /**
   * 获取自定义产品
   * @returns {Promise<Array>} 自定义产品列表
   */
  async getCustomProducts() {
    return withErrorHandling(async () => {
      const data = await this.storageService.getData(this.storageKey);
      return data || [];
    }, 'ProductRepository.getCustomProducts', ErrorType.STORAGE);
  }
  
  /**
   * 添加自定义产品
   * @param {Object} product 产品对象
   * @returns {Promise<boolean>} 操作是否成功
   */
  async addCustomProduct(product) {
    return withErrorHandling(async () => {
      const customProducts = await this.getCustomProducts();
      
      // 检查ID是否已存在
      if (customProducts.some(p => p.id === product.id)) {
        throw new Error(`Product with ID ${product.id} already exists`);
      }
      
      // 添加新产品
      customProducts.push(product);
      await this.storageService.setData(this.storageKey, customProducts);
      
      // 清除缓存
      this._cachedProducts = null;
      
      return true;
    }, 'ProductRepository.addCustomProduct', ErrorType.STORAGE);
  }
  
  /**
   * 更新自定义产品
   * @param {string} id 产品ID
   * @param {Object} updates 更新内容
   * @returns {Promise<boolean>} 操作是否成功
   */
  async updateCustomProduct(id, updates) {
    return withErrorHandling(async () => {
      const customProducts = await this.getCustomProducts();
      
      // 查找产品索引
      const index = customProducts.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error(`Product with ID ${id} not found`);
      }
      
      // 更新产品
      customProducts[index] = {
        ...customProducts[index],
        ...updates
      };
      
      await this.storageService.setData(this.storageKey, customProducts);
      
      // 清除缓存
      this._cachedProducts = null;
      
      return true;
    }, 'ProductRepository.updateCustomProduct', ErrorType.STORAGE);
  }
  
  /**
   * 删除自定义产品
   * @param {string} id 产品ID
   * @returns {Promise<boolean>} 操作是否成功
   */
  async deleteCustomProduct(id) {
    return withErrorHandling(async () => {
      const customProducts = await this.getCustomProducts();
      
      // 查找产品索引
      const index = customProducts.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error(`Product with ID ${id} not found`);
      }
      
      // 删除产品
      customProducts.splice(index, 1);
      await this.storageService.setData(this.storageKey, customProducts);
      
      // 清除缓存
      this._cachedProducts = null;
      
      return true;
    }, 'ProductRepository.deleteCustomProduct', ErrorType.STORAGE);
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this._cachedProducts = null;
  }
}

// 创建默认实例
const productRepository = new ProductRepository(storageService);

export default productRepository; 