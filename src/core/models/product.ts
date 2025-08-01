/**
 * 产品领域模型
 * 管理产品的属性和行为
 */

// ==================== 类型定义 ====================

/**
 * 产品类别枚举
 */
export enum ProductCategory {
  DAILY = 'DAILY',           // 日用品
  FOOD = 'FOOD',             // 食品
  ELECTRONICS = 'ELECTRONICS', // 电子产品
  LUXURY = 'LUXURY',         // 奢侈品
  COLLECTIBLE = 'COLLECTIBLE' // 收藏品
}

/**
 * 产品ID类型
 */
export type ProductId = string | number;

/**
 * 价格范围接口
 */
export interface PriceRange {
  min: number;
  max: number;
  range: number;
}

/**
 * 产品初始化选项接口
 */
export interface ProductOptions {
  /** 产品ID */
  id: ProductId;
  /** 产品名称 */
  name: string;
  /** 产品描述 */
  description?: string;
  /** 基础价格 */
  basePrice: number;
  /** 最低价格 */
  minPrice: number;
  /** 最高价格 */
  maxPrice: number;
  /** 价格波动性(1-10) */
  volatility?: number;
  /** 产品类别 */
  category?: ProductCategory;
  /** 产品大小(库存占用) */
  size?: number;
  /** 产品图标 */
  icon?: string;
  /** 可获得的地点 */
  availableAt?: string[];
}

/**
 * 产品数据接口（用于预定义产品列表）
 */
export interface ProductData {
  id: ProductId;
  name: string;
  description: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number;
  category: ProductCategory;
  size: number;
  icon: string;
  availableAt: string[];
}

/**
 * 地点接口（用于类型约束）
 */
export interface Location {
  id: string;
  name: string;
}

// ==================== 产品类 ====================

/**
 * 产品类
 * 封装产品的属性和行为
 */
export class Product {
  /** 产品ID */
  public readonly id: ProductId;
  /** 产品名称 */
  public readonly name: string;
  /** 产品描述 */
  public readonly description: string;
  /** 基础价格 */
  public readonly basePrice: number;
  /** 最低价格 */
  public readonly minPrice: number;
  /** 最高价格 */
  public readonly maxPrice: number;
  /** 价格波动性(1-10) */
  public readonly volatility: number;
  /** 产品类别 */
  public readonly category: ProductCategory;
  /** 产品大小(库存占用) */
  public readonly size: number;
  /** 产品图标 */
  public readonly icon: string;
  /** 可获得的地点 */
  public readonly availableAt: string[];

  /**
   * 创建产品实例
   */
  constructor({
    id,
    name,
    description = '',
    basePrice,
    minPrice,
    maxPrice,
    volatility = 5,
    category = ProductCategory.DAILY,
    size = 1,
    icon = 'box',
    availableAt = []
  }: ProductOptions) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.basePrice = basePrice;
    this.minPrice = minPrice;
    this.maxPrice = maxPrice;
    this.volatility = Math.min(Math.max(volatility, 1), 10); // 限制在1-10之间
    this.category = category;
    this.size = size;
    this.icon = icon;
    this.availableAt = availableAt;
  }

  /**
   * 获取价格范围
   */
  getPriceRange(): PriceRange {
    return {
      min: this.minPrice,
      max: this.maxPrice,
      range: this.maxPrice - this.minPrice
    };
  }

  /**
   * 检查价格是否在有效范围内
   */
  isValidPrice(price: number): boolean {
    return price >= this.minPrice && price <= this.maxPrice;
  }

  /**
   * 调整价格到有效范围
   */
  adjustPriceToRange(price: number): number {
    return Math.max(this.minPrice, Math.min(price, this.maxPrice));
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建产品工厂函数 - 类型1（OOP风格）
 */
export function createProduct(options: ProductOptions): Product {
  return new Product(options);
}

/**
 * 创建产品工厂函数 - 类型2（函数式风格，兼容旧版）
 */
export function createProductLegacy(
  id: ProductId,
  name: string,
  category: ProductCategory,
  minPrice: number,
  maxPrice: number,
  basePrice: number
): Product {
  return new Product({
    id,
    name,
    category,
    minPrice,
    maxPrice,
    basePrice,
    volatility: calculateVolatility(category),
    availableAt: getAvailableLocations(category)
  });
}

// ==================== 工具函数 ====================

/**
 * 根据类别计算商品价格波动率
 */
function calculateVolatility(category: ProductCategory): number {
  switch(category) {
    case ProductCategory.DAILY: return 2; // 日用品波动小
    case ProductCategory.FOOD: return 4;  // 食品中等波动
    case ProductCategory.ELECTRONICS: return 6; // 电子产品波动较大
    case ProductCategory.LUXURY: return 8; // 奢侈品大波动
    case ProductCategory.COLLECTIBLE: return 10; // 收藏品极大波动
    default: return 5;
  }
}

/**
 * 根据商品类别获取可用地点ID列表
 */
function getAvailableLocations(category: ProductCategory): string[] {
  switch(category) {
    case ProductCategory.DAILY:
      return ['second_hand_market', 'commodity_market'];
    case ProductCategory.FOOD:
      return ['commodity_market'];
    case ProductCategory.ELECTRONICS:
      return ['electronics_hub', 'premium_mall'];
    case ProductCategory.LUXURY:
      return ['premium_mall'];
    case ProductCategory.COLLECTIBLE:
      return ['black_market'];
    default:
      return ['second_hand_market'];
  }
}

/**
 * 获取指定地点可用的商品
 */
export function getAvailableProducts(location: Location, allProducts: Product[]): Product[] {
  if (!location || !allProducts) return [];

  return allProducts.filter(product =>
    product.availableAt.includes(location.id)
  );
}

// ==================== 预定义数据 ====================

// 预定义产品列表
const predefinedProducts: ProductData[] = [
  // 日常用品
  {
    id: 101,
    name: '卫生纸',
    description: '日常必备用品',
    basePrice: 15,
    minPrice: 10,
    maxPrice: 30,
    volatility: 2,
    category: ProductCategory.DAILY,
    size: 3,
    icon: 'paper',
    availableAt: ['commodity_market']
  },
  {
    id: 102,
    name: '洗发水',
    description: '日常洗护用品',
    basePrice: 35,
    minPrice: 20,
    maxPrice: 50,
    volatility: 2,
    category: ProductCategory.DAILY,
    size: 1,
    icon: 'bottle',
    availableAt: ['commodity_market']
  },
  {
    id: 103,
    name: '牙膏',
    description: '日常洗护用品',
    basePrice: 8,
    minPrice: 5,
    maxPrice: 15,
    volatility: 2,
    category: ProductCategory.DAILY,
    size: 1,
    icon: 'hygiene',
    availableAt: ['commodity_market']
  },
  {
    id: 104,
    name: '肥皂',
    description: '日常洗护用品',
    basePrice: 6,
    minPrice: 3,
    maxPrice: 12,
    volatility: 2,
    category: ProductCategory.DAILY,
    size: 1,
    icon: 'soap',
    availableAt: ['commodity_market']
  },
  {
    id: 105,
    name: '毛巾',
    description: '日常洗护用品',
    basePrice: 25,
    minPrice: 15,
    maxPrice: 40,
    volatility: 2,
    category: ProductCategory.DAILY,
    size: 2,
    icon: 'towel',
    availableAt: ['commodity_market']
  },
  // 二手市场特色商品
  {
    id: 106,
    name: '二手iPhone',
    description: '二手苹果手机，性价比高，版本各异',
    basePrice: 2000,
    minPrice: 1000,
    maxPrice: 4000,
    volatility: 5,
    category: ProductCategory.ELECTRONICS,
    size: 1,
    icon: 'phone',
    availableAt: ['second_hand_market']
  },
  {
    id: 107,
    name: '二手笔记本',
    description: '二手笔记本电脑，价格实惠但配置各异',
    basePrice: 2500,
    minPrice: 1200,
    maxPrice: 5000,
    volatility: 5,
    category: ProductCategory.ELECTRONICS,
    size: 5,
    icon: 'laptop',
    availableAt: ['second_hand_market']
  },
  {
    id: 108,
    name: '复古相机',
    description: '胶片相机，有一定收藏价值',
    basePrice: 500,
    minPrice: 300,
    maxPrice: 1200,
    volatility: 6,
    category: ProductCategory.ELECTRONICS,
    size: 3,
    icon: 'camera',
    availableAt: ['second_hand_market']
  },
  {
    id: 109,
    name: '二手游戏机',
    description: '各类游戏主机，价格实惠',
    basePrice: 800,
    minPrice: 500,
    maxPrice: 1800,
    volatility: 4,
    category: ProductCategory.ELECTRONICS,
    size: 4,
    icon: 'game',
    availableAt: ['second_hand_market']
  },
  {
    id: 110,
    name: '旧书籍',
    description: '二手书籍，知识的载体，价格便宜',
    basePrice: 20,
    minPrice: 5,
    maxPrice: 50,
    volatility: 2,
    category: ProductCategory.DAILY,
    size: 2,
    icon: 'book',
    availableAt: ['second_hand_market']
  },

  // 食品
  {
    id: 201,
    name: '鸡蛋',
    description: '新鲜食品，价格波动较大',
    basePrice: 15,
    minPrice: 8,
    maxPrice: 25,
    volatility: 4,
    category: ProductCategory.FOOD,
    size: 2,
    icon: 'egg',
    availableAt: ['commodity_market']
  },
  {
    id: 202,
    name: '大米',
    description: '主食，价格相对稳定',
    basePrice: 50,
    minPrice: 30,
    maxPrice: 80,
    volatility: 4,
    category: ProductCategory.FOOD,
    size: 5,
    icon: 'rice',
    availableAt: ['commodity_market']
  },
  {
    id: 203,
    name: '食用油',
    description: '烹饪必备，价格波动适中',
    basePrice: 70,
    minPrice: 40,
    maxPrice: 120,
    volatility: 4,
    category: ProductCategory.FOOD,
    size: 3,
    icon: 'oil',
    availableAt: ['commodity_market']
  },
  {
    id: 204,
    name: '新鲜蔬菜',
    description: '时令蔬菜，价格波动较大',
    basePrice: 30,
    minPrice: 15,
    maxPrice: 50,
    volatility: 4,
    category: ProductCategory.FOOD,
    size: 4,
    icon: 'vegetable',
    availableAt: ['commodity_market']
  },
  {
    id: 205,
    name: '水果',
    description: '时令水果，价格波动较大',
    basePrice: 35,
    minPrice: 20,
    maxPrice: 60,
    volatility: 4,
    category: ProductCategory.FOOD,
    size: 4,
    icon: 'fruit',
    availableAt: ['commodity_market']
  },

  // 电子产品
  {
    id: 301,
    name: '手机',
    description: '智能手机，价格波动适中',
    basePrice: 1800,
    minPrice: 1000,
    maxPrice: 3000,
    volatility: 6,
    category: ProductCategory.ELECTRONICS,
    size: 1,
    icon: 'phone',
    availableAt: ['electronics_hub', 'premium_mall'] // 更新可用地点
  },
  {
    id: 302,
    name: '电视',
    description: '家用电视，价格波动适中',
    basePrice: 3500,
    minPrice: 2000,
    maxPrice: 6000,
    volatility: 6,
    category: ProductCategory.ELECTRONICS,
    size: 15,
    icon: 'tv',
    availableAt: ['electronics_hub'] // 更新可用地点
  },
  {
    id: 303,
    name: '笔记本电脑',
    description: '便携式电脑，价格波动适中',
    basePrice: 4500,
    minPrice: 3000,
    maxPrice: 8000,
    volatility: 6,
    category: ProductCategory.ELECTRONICS,
    size: 5,
    icon: 'laptop',
    availableAt: ['electronics_hub'] // 更新可用地点
  },
  {
    id: 304,
    name: '平板电脑',
    description: '触屏平板设备，价格波动适中',
    basePrice: 2000,
    minPrice: 1200,
    maxPrice: 3500,
    volatility: 6,
    category: ProductCategory.ELECTRONICS,
    size: 3,
    icon: 'tablet',
    availableAt: ['electronics_hub'] // 更新可用地点
  },
  {
    id: 305,
    name: '智能手表',
    description: '可穿戴设备，价格波动较大',
    basePrice: 1500,
    minPrice: 800,
    maxPrice: 2500,
    volatility: 7,
    category: ProductCategory.ELECTRONICS,
    size: 1,
    icon: 'watch',
    availableAt: ['electronics_hub', 'premium_mall'] // 更新可用地点
  },

  // 奢侈品
  {
    id: 401,
    name: '名牌手表',
    description: '奢侈品，价格昂贵但保值',
    basePrice: 12000,
    minPrice: 8000,
    maxPrice: 20000,
    volatility: 8,
    category: ProductCategory.LUXURY,
    size: 1,
    icon: 'luxury-watch',
    availableAt: ['premium_mall'] // 更新可用地点
  },
  {
    id: 402,
    name: '钻石项链',
    description: '奢侈品，价格昂贵且波动较大',
    basePrice: 15000,
    minPrice: 10000,
    maxPrice: 25000,
    volatility: 8,
    category: ProductCategory.LUXURY,
    size: 1,
    icon: 'diamond',
    availableAt: ['premium_mall'] // 更新可用地点
  },
  {
    id: 403,
    name: '设计师包包',
    description: '高档手袋，有一定保值能力',
    basePrice: 8000,
    minPrice: 5000,
    maxPrice: 15000,
    volatility: 7,
    category: ProductCategory.LUXURY,
    size: 2,
    icon: 'bag',
    availableAt: ['premium_mall'] // 更新可用地点
  },
  {
    id: 404,
    name: '高级香水',
    description: '知名品牌香水，价格适中',
    basePrice: 1200,
    minPrice: 800,
    maxPrice: 2000,
    volatility: 5,
    category: ProductCategory.LUXURY,
    size: 1,
    icon: 'perfume',
    availableAt: ['premium_mall'] // 更新可用地点
  },

  // 收藏品
  {
    id: 501,
    name: '古董花瓶',
    description: '收藏品，价格波动非常大',
    basePrice: 9000,
    minPrice: 4000,
    maxPrice: 20000,
    volatility: 9,
    category: ProductCategory.COLLECTIBLE,
    size: 4,
    icon: 'vase',
    availableAt: ['black_market'] // 更新可用地点
  },
  {
    id: 502,
    name: '邮票',
    description: '收藏邮票，价格波动极大',
    basePrice: 3000,
    minPrice: 1000,
    maxPrice: 10000,
    volatility: 10,
    category: ProductCategory.COLLECTIBLE,
    size: 1,
    icon: 'stamp',
    availableAt: ['black_market'] // 更新可用地点
  },
  {
    id: 503,
    name: '古画',
    description: '艺术收藏品，价格波动极大',
    basePrice: 20000,
    minPrice: 10000,
    maxPrice: 50000,
    volatility: 10,
    category: ProductCategory.COLLECTIBLE,
    size: 8,
    icon: 'painting',
    availableAt: ['black_market'] // 更新可用地点
  },
  {
    id: 504,
    name: '老式相机',
    description: '古董相机，收藏价值高',
    basePrice: 4500,
    minPrice: 2000,
    maxPrice: 10000,
    volatility: 8,
    category: ProductCategory.COLLECTIBLE,
    size: 3,
    icon: 'camera',
    availableAt: ['black_market', 'electronics_hub'] // 更新可用地点
  },
  {
    id: 505,
    name: '纪念币',
    description: '限量发行的纪念币，收藏价值高',
    basePrice: 2500,
    minPrice: 1000,
    maxPrice: 8000,
    volatility: 9,
    category: ProductCategory.COLLECTIBLE,
    size: 1,
    icon: 'coin',
    availableAt: ['black_market'] // 更新可用地点
  }
];

// ==================== 导出函数 ====================

/**
 * 获取所有产品列表
 */
export function getAllProducts(): Product[] {
  return predefinedProducts.map(productData => createProduct(productData));
}

/**
 * 根据ID获取产品
 */
export function getProductById(id: ProductId): Product | null {
  const productData = predefinedProducts.find(p => p.id == id);
  return productData ? createProduct(productData) : null;
}