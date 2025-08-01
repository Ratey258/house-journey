/**
 * 产品仓储 - TypeScript版本
 * 负责产品数据的存取
 */

import { 
  getAllProducts, 
  getProductById as getCoreProductById, 
  Product, 
  type ProductId 
} from '@/core/models/product';
import { BaseRepository, type DTO, type IStorageService } from './base-repository';
import { withErrorHandling } from '@/infrastructure/utils/errorHandler';
import { ErrorType } from '@/infrastructure/utils/errorTypes';
import storageService from './storageService';

// ==================== 类型定义 ====================

/**
 * 产品数据传输对象
 */
export interface ProductDTO extends DTO<Product> {
  id: ProductId;
  name: string;
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  specialLocations?: string[];
  description?: string;
}

/**
 * 自定义产品
 */
export interface CustomProduct extends Product {
  isCustom: true;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 产品仓储类 ====================

/**
 * 产品仓储类
 * 继承基础仓储类，提供类型安全的产品数据管理
 */
export class ProductRepository extends BaseRepository<Product, ProductId> {
  private _cachedProducts: Product[] | null = null;
  private _coreProducts: Product[] | null = null;

  /**
   * 构造函数
   * @param storageService 存储服务
   */
  constructor(storageService: IStorageService) {
    super(storageService, 'custom_products');
  }

  /**
   * 获取所有产品（包括核心产品和自定义产品）
   * @returns 产品列表
   */
  async getAllProducts(): Promise<Product[]> {
    return withErrorHandling(async () => {
      if (this._cachedProducts) {
        return this._cachedProducts;
      }

      // 获取核心产品
      const coreProducts = getAllProducts();
      this._coreProducts = coreProducts;

      // 获取自定义产品
      const customProducts = await this.getAll();

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
    }, 'ProductRepository.getAllProducts', ErrorType.DATA_ACCESS);
  }

  /**
   * 根据ID获取产品
   * @param id 产品ID
   * @returns 产品对象或null
   */
  async getProductById(id: ProductId): Promise<Product | null> {
    return withErrorHandling(async () => {
      // 先尝试从核心产品中获取
      const coreProduct = getCoreProductById(id);
      if (coreProduct) {
        return coreProduct;
      }

      // 再从自定义产品中获取
      return this.getById(id);
    }, 'ProductRepository.getProductById', ErrorType.DATA_ACCESS);
  }

  /**
   * 获取核心产品列表
   * @returns 核心产品列表
   */
  getCoreProducts(): Product[] {
    return getAllProducts();
  }

  /**
   * 获取自定义产品列表
   * @returns 自定义产品列表
   */
  async getCustomProducts(): Promise<Product[]> {
    return this.getAll();
  }

  /**
   * 添加自定义产品
   * @param product 产品对象
   * @returns 操作是否成功
   */
  async addCustomProduct(product: Omit<Product, 'id'> & { id?: ProductId }): Promise<boolean> {
    return withErrorHandling(async () => {
      // 检查ID是否与核心产品冲突
      if (product.id && getCoreProductById(product.id)) {
        throw new Error(`Product ID '${product.id}' conflicts with core product`);
      }

      // 生成ID（如果没有提供）
      const productToSave: Product = {
        ...product,
        id: product.id || `custom_${Date.now()}`
      } as Product;

      await this.save(productToSave);
      this._cachedProducts = null; // 清除缓存
      return true;
    }, 'ProductRepository.addCustomProduct', ErrorType.DATA_ACCESS);
  }

  /**
   * 更新自定义产品
   * @param id 产品ID
   * @param updates 更新内容
   * @returns 操作是否成功
   */
  async updateCustomProduct(id: ProductId, updates: Partial<Product>): Promise<boolean> {
    return withErrorHandling(async () => {
      // 检查是否为核心产品
      if (getCoreProductById(id)) {
        throw new Error(`Cannot update core product: ${id}`);
      }

      const existingProduct = await this.getById(id);
      if (!existingProduct) {
        throw new Error(`Product not found: ${id}`);
      }

      const updatedProduct: Product = {
        ...existingProduct,
        ...updates,
        id // 确保ID不被修改
      };

      await this.save(updatedProduct);
      this._cachedProducts = null; // 清除缓存
      return true;
    }, 'ProductRepository.updateCustomProduct', ErrorType.DATA_ACCESS);
  }

  /**
   * 删除自定义产品
   * @param id 产品ID
   * @returns 操作是否成功
   */
  async deleteCustomProduct(id: ProductId): Promise<boolean> {
    return withErrorHandling(async () => {
      // 检查是否为核心产品
      if (getCoreProductById(id)) {
        throw new Error(`Cannot delete core product: ${id}`);
      }

      const deleted = await this.delete(id);
      if (deleted) {
        this._cachedProducts = null; // 清除缓存
      }
      return deleted;
    }, 'ProductRepository.deleteCustomProduct', ErrorType.DATA_ACCESS);
  }

  /**
   * 按类别获取产品
   * @param category 产品类别
   * @returns 该类别的产品列表
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    const allProducts = await this.getAllProducts();
    return allProducts.filter(product => product.category === category);
  }

  /**
   * 搜索产品
   * @param query 搜索关键词
   * @returns 匹配的产品列表
   */
  async searchProducts(query: string): Promise<Product[]> {
    const allProducts = await this.getAllProducts();
    const lowerQuery = query.toLowerCase();
    
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery) ||
      (product.description && product.description.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this._cachedProducts = null;
    this._coreProducts = null;
  }

  /**
   * 刷新缓存
   */
  async refreshCache(): Promise<void> {
    this.clearCache();
    await super.refreshCache();
  }

  // ==================== BaseRepository 抽象方法实现 ====================

  /**
   * 获取实体ID
   * @param entity 产品实体
   * @returns 产品ID
   */
  getEntityId(entity: Product): ProductId {
    return entity.id;
  }

  /**
   * 将DTO映射为产品实体
   * @param dto 数据传输对象
   * @returns 产品实体
   */
  mapToEntity(dto: ProductDTO): Product {
    return {
      id: dto.id,
      name: dto.name,
      category: dto.category,
      priceRange: dto.priceRange,
      specialLocations: dto.specialLocations,
      description: dto.description
    } as Product;
  }

  /**
   * 将产品实体映射为DTO
   * @param entity 产品实体
   * @returns 数据传输对象
   */
  mapToDTO(entity: Product): ProductDTO {
    return {
      id: entity.id,
      name: entity.name,
      category: entity.category,
      priceRange: entity.priceRange,
      specialLocations: entity.specialLocations,
      description: entity.description
    };
  }
}

// ==================== 默认实例 ====================

/**
 * 创建默认产品仓储实例
 */
const productRepository = new ProductRepository(storageService);

export default productRepository;