/**
 * 预定义产品数据 - 从原项目提取
 * 保持完整的游戏产品列表
 */

import { ProductCategory, type ProductData } from '../model/Product';

/**
 * 预定义产品列表
 */
export const predefinedProducts: ProductData[] = [
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
    availableAt: ['electronics_hub', 'premium_mall']
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
    availableAt: ['electronics_hub']
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
    availableAt: ['electronics_hub']
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
    availableAt: ['electronics_hub']
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
    availableAt: ['electronics_hub', 'premium_mall']
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
    availableAt: ['premium_mall']
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
    availableAt: ['premium_mall']
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
    availableAt: ['premium_mall']
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
    availableAt: ['premium_mall']
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
    availableAt: ['black_market']
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
    availableAt: ['black_market']
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
    availableAt: ['black_market']
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
    availableAt: ['black_market', 'electronics_hub']
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
    availableAt: ['black_market']
  }
];