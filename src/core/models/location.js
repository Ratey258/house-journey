/**
 * 地点领域模型
 * 管理游戏中的地点及其属性
 */

/**
 * 地点类
 * 封装地点的属性和行为
 */
export class Location {
  /**
   * 创建地点实例
   * @param {Object} options 地点初始化选项
   * @param {string} options.id 地点ID
   * @param {string} options.name 地点名称
   * @param {string} options.description 地点描述
   * @param {Array<string>} options.availableProducts 可用产品ID列表
   * @param {Array<string|number>} options.specialProducts 特价产品ID列表
   * @param {Object} options.modifiers 地点修正因子
   * @param {string} options.icon 地点图标
   * @param {string} options.image 地点图片
   * @param {number} options.eventProbability 事件触发概率
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
  }) {
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
   * @returns {number} 价格修正因子
   */
  getPriceFactor() {
    return this.modifiers.priceFactor || 1.0;
  }

  /**
   * 检查产品是否为特价商品
   * @param {string|number} productId 产品ID
   * @returns {boolean} 是否为特价商品
   */
  isSpecialProduct(productId) {
    return this.specialProducts.includes(productId);
  }

  /**
   * 检查产品是否在此地点可用
   * @param {string|number} productId 产品ID
   * @returns {boolean} 产品是否可用
   */
  hasProduct(productId) {
    // 在优化后的系统中，产品可用性通过Product.availableAt来检查
    // 但为了兼容性，我们仍然提供这个方法
    return this.availableProducts.includes(productId) || this.specialProducts.includes(productId);
  }

  /**
   * 应用地点特定的价格修正
   * @param {number} basePrice 基础价格
   * @param {string|number} productId 产品ID
   * @returns {number} 修正后的价格
   */
  applyPriceModifiers(basePrice, productId) {
    let price = basePrice * this.getPriceFactor();

    // 特价商品折扣
    if (this.isSpecialProduct(productId)) {
      price *= 0.85; // 特价商品享受85折
    }

    return Math.round(price);
  }
}

/**
 * 创建地点工厂函数 - 类型1（OOP风格）
 * @param {Object} options 地点初始化选项
 * @returns {Location} 新的地点实例
 */
export function createLocation(options) {
  return new Location(options);
}

/**
 * 创建地点工厂函数 - 类型2（函数式风格，兼容旧版）
 * @param {string} id 地点ID
 * @param {string} name 地点名称
 * @param {string} description 地点描述
 * @param {number} priceModifier 价格修正系数
 * @param {Array<string|number>} specialProducts 特色商品ID列表
 * @returns {Location} 地点实例
 */
export function createLocationLegacy(id, name, description, priceModifier, specialProducts) {
  return new Location({
    id,
    name,
    description,
    modifiers: { priceFactor: priceModifier },
    specialProducts,
    icon: getLocationIcon(id)
  });
}

/**
 * 获取地点图标路径
 * @param {string} locationId 地点ID
 * @returns {string} 图标路径
 */
function getLocationIcon(locationId) {
  // 实际实现时会返回真实的图标路径
  const iconMap = {
    'second_hand_market': 'second-hand.png',
    'premium_mall': 'premium.png',
    'electronics_hub': 'electronics.png',
    'collectors_market': 'collectors.png',
    'commodity_market': 'commodity.png'
  };

  return iconMap[locationId] || 'default.png';
}

// 优化后的地点列表：从10个地点精简为5个，每个地点有明确的特色和功能定位
const predefinedLocations = [
  // 1. 大宗商品交易所 - 大批量商品交易的场所
  {
    id: 'commodity_market',
    name: '大宗商品交易所',
    description: '批发市场和大宗商品交易的集中地，价格低廉但需要大量采购。这里适合大量进货获取更好的价格优势。',
    modifiers: { priceFactor: 0.75 },
    specialProducts: [202, 203], // 特色商品：大米和食用油（批发量大的主食和烹饪必需品）
    availableProducts: ['bulk_rice', 'bulk_goods', 'industrial_materials'],
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
    availableProducts: ['used_electronics', 'retro_games', 'collectibles', 'books', 'used_items'],
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
    availableProducts: ['jewelry', 'watch', 'designer_clothes'],
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
    availableProducts: ['phone', 'laptop', 'tablet', 'camera'],
    eventProbability: 0.3,
    icon: 'electronics.png',
    image: 'electronics_hub.jpg'
  },

  // 5. 收藏家市场 - 专注于收藏品和古董的特殊市场
  {
    id: 'black_market',
    name: '地下黑市',
    description: '隐蔽的非法交易场所，各类珍稀收藏品和奇特商品云集。风险与机遇并存，是寻找稀有物品的绝佳地点。',
    modifiers: { priceFactor: 1.1 },
    specialProducts: [502, 503], // 特色商品：邮票和古画（稀有收藏品）
    availableProducts: ['stamp', 'antique', 'artwork', 'rare_coin'],
    eventProbability: 0.35,
    icon: 'black-market.png',
    image: 'black_market.jpg'
  }
];

/**
 * 获取所有地点列表
 * @returns {Array<Location>} 地点列表
 */
export function getAllLocations() {
  return predefinedLocations.map(locationData => createLocation(locationData));
}

/**
 * 根据ID获取地点
 * @param {string} id 地点ID
 * @returns {Location|null} 地点实例或null
 */
export function getLocationById(id) {
  const locationData = predefinedLocations.find(l => l.id === id);
  return locationData ? createLocation(locationData) : null;
}
