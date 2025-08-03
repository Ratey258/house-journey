/**
 * 产品实体统一导出
 */

// 导出主要实体类
export { 
  Product, 
  createProduct, 
  createProductLegacy, 
  getAvailableProducts,
  getAllProducts,
  getProductById 
} from './model/Product';

// 导出类型定义
export type {
  ProductId,
  ProductCategory,
  PriceRange,
  ProductOptions,
  ProductData,
  Location
} from './model/Product';

// 导出枚举
export { ProductCategory as ProductCategoryEnum } from './model/Product';

// 导出预定义数据
export { predefinedProducts } from './data/predefined-products';