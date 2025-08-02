/**
 * 地点领域模型
 * 管理游戏中的地点及其属性
 */

// ==================== 类型定义 ====================

/**
 * 地点ID类型
 */
export type LocationId = 'commodity_market' | 'second_hand_market' | 'premium_mall' | 'electronics_hub' | 'black_market' | string;

/**
 * 产品ID类型
 */
export type ProductId = string | number;

/**
 * 地点修正因子接口
 */
export interface LocationModifiers {
  /** 价格修正因子 */
  priceFactor: number;
}

/**
 * 地点初始化选项接口
 */
export interface LocationOptions {
  /** 地点ID */
  id: LocationId;
  /** 地点名称 */
  name: string;
  /** 地点描述 */
  description?: string;
  /** 可用产品ID列表 */
  availableProducts?: ProductId[];
  /** 特价产品ID列表 */
  specialProducts?: ProductId[];
  /** 地点修正因子 */
  modifiers?: LocationModifiers;
  /** 地点图标 */
  icon?: string;
  /** 地点图片 */
  image?: string;
  /** 事件触发概率 */
  eventProbability?: number;
}

/**
 * 地点数据接口（用于预定义地点列表）
 */
export interface LocationData {
  id: LocationId;
  name: string;
  description: string;
  modifiers: LocationModifiers;
  specialProducts: ProductId[];
  availableProducts: string[];
  eventProbability: number;
  icon: string;
  image: string;
}

// ==================== 地点类 ====================

/**
 * 地点类
 * 封装地点的属性和行为
 */
export class Location {
  /** 地点ID */
  public readonly id: LocationId;
  /** 地点名称 */
  public readonly name: string;
  /** 地点描述 */
  public readonly description: string;
  /** 可用产品ID列表 */
  public readonly availableProducts: ProductId[];
  /** 特价产品ID列表 */
  public readonly specialProducts: ProductId[];
  /** 地点修正因子 */
  public readonly modifiers: LocationModifiers;
  /** 地点图标 */
  public readonly icon: string;
  /** 地点图片 */
  public readonly image: string;  
  /** 事件触发概率 */
  public readonly eventProbability: number;

  /**
   * 创建地点实例
   */
  constructor({
    id,
    name,
    description = '',
    availableProducts = [],
    specialProducts = [],
    modifiers = { priceFactor: 1.0 },
    icon = 'map-marker',
    image = '',
    eventProbability = 0.3
  }: LocationOptions) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.availableProducts = availableProducts;
    this.specialProducts = specialProducts;
    this.modifiers = modifiers;
    this.icon = icon;
    this.image = image;
    this.eventProbability = eventProbability;
  }

  /**
   * 获取价格修正因子
   */
  getPriceFactor(): number {
    return this.modifiers.priceFactor || 1.0;
  }

  /**
   * 检查产品是否为特价商品
   */
  isSpecialProduct(productId: ProductId): boolean {
    return this.specialProducts.includes(productId);
  }

  /**
   * 检查产品是否在此地点可用
   */
  hasProduct(productId: ProductId): boolean {
    // 在优化后的系统中，产品可用性通过Product.availableAt来检查
    // 但为了兼容性，我们仍然提供这个方法
    return this.availableProducts.includes(productId) || this.specialProducts.includes(productId);
  }

  /**
   * 应用地点特定的价格修正
   */
  applyPriceModifiers(basePrice: number, productId: ProductId): number {
    let price = basePrice * this.getPriceFactor();

    // 特价商品折扣
    if (this.isSpecialProduct(productId)) {
      price *= 0.85; // 特价商品享受85折
    }

    return Math.round(price);
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建地点工厂函数 - 类型1（OOP风格）
 */
export function createLocation(options: LocationOptions): Location {
  return new Location(options);
}

/**
 * 创建地点工厂函数 - 类型2（函数式风格，兼容旧版）
 */
export function createLocationLegacy(
  id: LocationId,
  name: string,
  description: string,
  priceModifier: number,
  specialProducts: ProductId[]
): Location {
  return new Location({
    id,
    name,
    description,
    modifiers: { priceFactor: priceModifier },
    specialProducts,
    icon: getLocationIcon(id)
  });
}

// ==================== 工具函数 ====================

/**
 * 获取地点图标路径
 */
function getLocationIcon(locationId: LocationId): string {
  // 实际实现时会返回真实的图标路径
  const iconMap: Record<string, string> = {
    'second_hand_market': 'second-hand.png',
    'premium_mall': 'premium.png',
    'electronics_hub': 'electronics.png',
    'collectors_market': 'collectors.png',
    'commodity_market': 'commodity.png'
  };

  return iconMap[locationId] || 'default.png';
}

// ==================== 预定义数据 ====================

// 优化后的地点列表：从10个地点精简为5个，每个地点有明确的特色和功能定位
const predefinedLocations: LocationData[] = [
  // 1. 大宗商品交易所 - 大批量商品交易的场所
  {
    id: 'commodity_market',
    name: '大宗商品交易所',
    description: '批发市场和大宗商品交易的集中地，价格低廉但需要大量采购。这里适合大量进货获取更好的价格优势。',
    modifiers: { priceFactor: 0.75 },
    specialProducts: [202, 203], // 特色商品：大米和食用油（批发量大的主食和烹饪必需品）
    availableProducts: ['101', '102', '103', '104', '105', '202', '203', '204', '205'],
    eventProbability: 0.2,
    icon: 'commodity.png',
    image: 'commodity_market.jpg'
  },

  // 2. 二手市场 - 二手物品和低价日用品的集中地
  {
    id: 'second_hand_market',
    name: '二手市场',
    description: '各类二手商品的集散地，尤其以二手数码产品为特色。这里可以淘到价格实惠的电子产品和各类二手物品，但品质参差不齐。',
    modifiers: { priceFactor: 0.8 },
    specialProducts: [], // 二手市场不再有特价商品
    availableProducts: ['106', '107', '108'],
    eventProbability: 0.3,
    icon: 'second-hand.png',
    image: 'second_hand_market.jpg'
  },

  // 3. 高端商城 - 奢侈品和高端商品的销售地点
  {
    id: 'premium_mall',
    name: '高端商城',
    description: '汇聚各类高端品牌和奢侈品的购物中心，价格昂贵但品质优良。这里是购买珠宝、手表等高端商品的地方。',
    modifiers: { priceFactor: 1.3 },
    specialProducts: [401, 404], // 特色商品：名牌手表和高级香水（高端奢侈品）
    availableProducts: ['301', '305', '401', '402', '403', '404'],
    eventProbability: 0.25,
    icon: 'premium.png',
    image: 'premium_mall.jpg'
  },

  // 4. 电子科技城 - 专注于电子产品的交易中心
  {
    id: 'electronics_hub',
    name: '电子科技城',
    description: '各类电子产品和数码设备的专业交易市场，价格适中且品种齐全。这里是购买手机、电脑等电子产品的理想之地。',
    modifiers: { priceFactor: 0.95 },
    specialProducts: [301, 305], // 特色商品：手机和智能手表（常见电子产品）
    availableProducts: ['301', '302', '303', '304', '305', '504'],
    eventProbability: 0.3,
    icon: 'electronics.png',
    image: 'electronics_hub.jpg'
  },

  // 5. 地下黑市 - 专注于收藏品和古董的特殊市场
  {
    id: 'black_market',
    name: '地下黑市',
    description: '隐蔽的非法交易场所，各类珍稀收藏品和奇特商品云集。风险与机遇并存，是寻找稀有物品的绝佳地点。',
    modifiers: { priceFactor: 1.1 },
    specialProducts: [502, 503], // 特色商品：邮票和古画（稀有收藏品）
    availableProducts: ['501', '502', '503', '504', '505'],
    eventProbability: 0.35,
    icon: 'black-market.png',
    image: 'black_market.jpg'
  }
];

// ==================== 导出函数 ====================

/**
 * 获取所有地点列表
 */
export function getAllLocations(): Location[] {
  return predefinedLocations.map(locationData => createLocation(locationData));
}

/**
 * 根据ID获取地点
 */
export function getLocationById(id: LocationId): Location | null {
  const locationData = predefinedLocations.find(l => l.id === id);
  return locationData ? createLocation(locationData) : null;
}