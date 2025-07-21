/**
 * 产品领域模型
 * 管理产品的属性和行为
 */

/**
 * 产品类别枚举
 */
export const ProductCategory = {
  DAILY: 'DAILY',           // 日用品
  FOOD: 'FOOD',             // 食品
  ELECTRONICS: 'ELECTRONICS', // 电子产品
  LUXURY: 'LUXURY',         // 奢侈品
  COLLECTIBLE: 'COLLECTIBLE' // 收藏品
};

/**
 * 产品类
 * 封装产品的属性和行为
 */
export class Product {
  /**
   * 创建产品实例
   * @param {Object} options 产品初始化选项
   * @param {string|number} options.id 产品ID
   * @param {string} options.name 产品名称
   * @param {string} options.description 产品描述
   * @param {number} options.basePrice 基础价格
   * @param {number} options.minPrice 最低价格
   * @param {number} options.maxPrice 最高价格
   * @param {number} options.volatility 价格波动性(1-10)
   * @param {string} options.category 产品类别
   * @param {number} options.size 产品大小(库存占用)
   * @param {string} options.icon 产品图标
   * @param {Array<string>} options.availableAt 可获得的地点
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
  }) {
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
   * @returns {Object} 价格范围对象
   */
  getPriceRange() {
    return {
      min: this.minPrice,
      max: this.maxPrice,
      range: this.maxPrice - this.minPrice
    };
  }
  
  /**
   * 检查价格是否在有效范围内
   * @param {number} price 要检查的价格
   * @returns {boolean} 价格是否有效
   */
  isValidPrice(price) {
    return price >= this.minPrice && price <= this.maxPrice;
  }
  
  /**
   * 调整价格到有效范围
   * @param {number} price 原始价格
   * @returns {number} 调整后的价格
   */
  adjustPriceToRange(price) {
    return Math.max(this.minPrice, Math.min(price, this.maxPrice));
  }
}

/**
 * 创建产品工厂函数 - 类型1（OOP风格）
 * @param {Object} options 产品初始化选项
 * @returns {Product} 新的产品实例
 */
export function createProduct(options) {
  return new Product(options);
}

/**
 * 创建产品工厂函数 - 类型2（函数式风格，兼容旧版）
 * @param {string|number} id 商品ID
 * @param {string} name 商品名称
 * @param {string} category 商品类别
 * @param {number} minPrice 最低价格
 * @param {number} maxPrice 最高价格
 * @param {number} basePrice 基础价格
 * @returns {Object} 商品对象
 */
export function createProductLegacy(id, name, category, minPrice, maxPrice, basePrice) {
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

/**
 * 根据类别计算商品价格波动率
 * @param {string} category 商品类别
 * @returns {number} 波动率(1-10)
 */
function calculateVolatility(category) {
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
 * @param {string} category 商品类别
 * @returns {Array} 可用地点ID列表
 */
function getAvailableLocations(category) {
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
 * @param {Object} location 地点对象
 * @param {Array} allProducts 所有商品对象
 * @returns {Array} 该地点可用的商品数组
 */
export function getAvailableProducts(location, allProducts) {
  if (!location || !allProducts) return [];
  
  return allProducts.filter(product => 
    product.availableAt.includes(location.id)
  );
}

// 预定义产品列表
const predefinedProducts = [
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
    availableAt: ['second_hand_market', 'commodity_market']
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
    availableAt: ['second_hand_market', 'commodity_market']
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
    availableAt: ['second_hand_market', 'commodity_market']
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
    availableAt: ['second_hand_market', 'commodity_market']
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
    availableAt: ['second_hand_market', 'commodity_market']
  },
  // 新增二手物品
  {
    id: 106,
    name: '二手衣物',
    description: '二手服装，价格便宜但品质一般',
    basePrice: 40,
    minPrice: 20,
    maxPrice: 80,
    volatility: 3,
    category: ProductCategory.DAILY,
    size: 4,
    icon: 'clothes',
    availableAt: ['second_hand_market']
  },
  {
    id: 107,
    name: '二手家具',
    description: '二手家具，价格实惠',
    basePrice: 200,
    minPrice: 100,
    maxPrice: 500,
    volatility: 4,
    category: ProductCategory.DAILY,
    size: 10,
    icon: 'furniture',
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
  
  // 收藏品 (501-505)
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

/**
 * 获取所有产品列表
 * @returns {Array<Product>} 产品列表
 */
export function getAllProducts() {
  return predefinedProducts.map(productData => createProduct(productData));
}

/**
 * 根据ID获取产品
 * @param {string|number} id 产品ID
 * @returns {Product|null} 产品实例或null
 */
export function getProductById(id) {
  const productData = predefinedProducts.find(p => p.id == id);
  return productData ? createProduct(productData) : null;
} 