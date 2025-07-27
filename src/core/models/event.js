/**
 * 事件领域模型
 * 管理游戏中的事件及其属性
 */

/**
 * 事件类型枚举
 */
export const EventType = {
  RANDOM: 'random',       // 随机事件
  STORY: 'story',         // 故事/剧情事件
  LOCATION: 'location',   // 地点特定事件
  MARKET: 'market',       // 市场事件
  PERSONAL: 'personal',   // 个人事件
  TUTORIAL: 'tutorial'    // 教程事件
};

/**
 * 事件效果类型枚举
 */
export const EffectType = {
  MONEY: 'money',                    // 金钱变化
  DEBT: 'debt',                      // 债务变化
  INVENTORY: 'inventory',            // 物品变化
  MARKET: 'market',                  // 市场影响
  ATTRIBUTE: 'attribute',            // 属性变化
  LOCATION: 'location',              // 地点变化
  CAPACITY: 'capacity',              // 背包容量变化
  NEXT_EVENT: 'next_event',          // 触发下一个事件
  GAME_STATE: 'game_state'           // 游戏状态变化
};

/**
 * 事件类
 * 封装事件的属性和行为
 */
export class Event {
  /**
   * 创建事件实例
   * @param {Object} options 事件初始化选项
   * @param {string} options.id 事件ID
   * @param {string} options.title 事件标题
   * @param {string} options.description 事件描述
   * @param {Array} options.options 事件选项
   * @param {Object} options.conditions 触发条件
   * @param {boolean} options.repeatable 是否可重复触发
   * @param {string} options.type 事件类型
   * @param {number} options.weight 触发权重
   * @param {string} options.imageUrl 事件图像URL
   */
  constructor({
    id,
    title,
    description,
    options = [],
    conditions = {},
    repeatable = false,
    type = EventType.RANDOM,
    weight = 1,
    imageUrl = null
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.options = options;
    this.conditions = conditions;
    this.repeatable = repeatable;
    this.type = type;
    this.weight = weight;
    // 暂时禁用事件图片
    this.imageUrl = null; // imageUrl;
  }
  
  /**
   * 检查事件是否可以在当前游戏状态下触发
   * @param {Object} gameState 游戏状态
   * @param {Array} triggeredEvents 已触发事件列表
   * @returns {boolean} 是否可触发
   */
  canTrigger(gameState, triggeredEvents = []) {
    const c = this.conditions;
    
    // 检查是否可重复触发
    if (!this.repeatable && triggeredEvents.includes(this.id)) {
      return false;
    }
    
    // 检查周数限制
    if (c.minWeek !== null && gameState.currentWeek < c.minWeek) {
      return false;
    }
    
    if (c.maxWeek !== null && gameState.currentWeek > c.maxWeek) {
      return false;
    }
    
    // 检查地点限制
    if (c.locations !== null && !c.locations.includes(gameState.currentLocation?.id)) {
      return false;
    }
    
    // 检查金钱限制
    if (c.playerMoney !== null) {
      const money = gameState.player.money;
      if (c.playerMoney.min !== undefined && money < c.playerMoney.min) return false;
      if (c.playerMoney.max !== undefined && money > c.playerMoney.max) return false;
    }
    
    // 检查债务限制
    if (c.playerDebt !== null) {
      const debt = gameState.player.debt;
      if (c.playerDebt.min !== undefined && debt < c.playerDebt.min) return false;
      if (c.playerDebt.max !== undefined && debt > c.playerDebt.max) return false;
    }
    
    // 检查背包物品限制
    if (c.inventoryItems !== null) {
      for (const item of c.inventoryItems) {
        const inventoryItem = gameState.player.inventory.find(i => i.productId === item.productId);
        const quantity = inventoryItem ? inventoryItem.quantity : 0;
        
        if (item.minQuantity !== undefined && quantity < item.minQuantity) return false;
        if (item.maxQuantity !== undefined && quantity > item.maxQuantity) return false;
      }
    }
    
    // 检查属性限制
    if (c.attributes !== null) {
      for (const [attr, limits] of Object.entries(c.attributes)) {
        const value = gameState.player.attributes?.[attr] || 0;
        if (limits.min !== undefined && value < limits.min) return false;
        if (limits.max !== undefined && value > limits.max) return false;
      }
    }
    
    // 检查需要已触发的事件
    if (c.requiredEvents !== null) {
      for (const eventId of c.requiredEvents) {
        if (!triggeredEvents.includes(eventId)) return false;
      }
    }
    
    // 检查需要未触发的事件
    if (c.excludedEvents !== null) {
      for (const eventId of c.excludedEvents) {
        if (triggeredEvents.includes(eventId)) return false;
      }
    }
    
    // 检查自定义条件
    if (c.customCondition !== null && !c.customCondition(gameState)) {
      return false;
    }
    
    // 应用概率
    return Math.random() <= (c.probability || 1);
  }
  
  /**
   * 获取可用的事件选项
   * @param {Object} gameState 游戏状态
   * @returns {Array} 可用的事件选项
   */
  getAvailableOptions(gameState) {
    return this.options.filter(option => {
      return option.condition === null || option.condition(gameState);
    });
  }
}

/**
 * 事件选项类
 * 封装事件选项的属性和行为
 */
export class EventOption {
  /**
   * 创建事件选项实例
   * @param {Object} options 选项初始化配置
   * @param {string} options.text 选项文本
   * @param {string} options.result 结果文本
   * @param {Object} options.effects 效果对象
   * @param {Function} options.condition 选项显示条件
   */
  constructor({
    text,
    result,
    effects,
    condition = null
  }) {
    this.text = text;
    this.result = result;
    this.effects = effects;
    this.condition = condition;
  }
  
  /**
   * 检查选项是否可用
   * @param {Object} gameState 游戏状态
   * @returns {boolean} 选项是否可用
   */
  isAvailable(gameState) {
    return this.condition === null || this.condition(gameState);
  }
}

/**
 * 事件效果类
 * 封装事件效果的属性
 */
export class EventEffects {
  /**
   * 创建事件效果实例
   * @param {Object} options 效果初始化配置
   * @param {number} options.money 金钱变化（正数增加，负数减少，小于1的小数表示百分比）
   * @param {number} options.debt 债务变化（正数增加，负数减少，小于1的小数表示百分比）
   * @param {Array} options.inventory 物品变化 [{productId, quantity, priceModifier}]
   * @param {Object} options.attributes 属性变化 {businessSkill, creditRating, etc.}
   * @param {Object} options.market 市场影响
   * @param {number} options.market.globalPriceModifier 全局价格修正因子
   * @param {Object} options.market.categoryModifiers 类别价格修正因子 {category: modifier}
   * @param {Object} options.market.productModifiers 商品价格修正因子 {productId: modifier}
   * @param {Object} options.market.locationModifiers 地区价格修正因子 {locationId: modifier}
   * @param {Object} options.market.locationProductModifiers 特定地区特定商品价格修正因子 {locationId: {productId: modifier}}
   * @param {number} options.market.duration 效果持续时间（周数）
   * @param {boolean} options.forceLocationChange 强制切换地点
   * @param {string} options.targetLocation 目标地点ID
   * @param {number} options.capacity 背包容量变化
   * @param {string} options.nextEvent 连锁事件ID
   * @param {Object} options.gameState 游戏状态变化 {gamePaused, forceGameOver, etc.}
   */
  constructor({
    money = 0,          // 金钱变化（正数增加，负数减少，小于1的小数表示百分比）
    debt = 0,           // 债务变化（正数增加，负数减少，小于1的小数表示百分比）
    inventory = [],     // 物品变化 [{productId, quantity, priceModifier}]
    attributes = {},    // 属性变化 {businessSkill, creditRating, etc.}
    market = null,      // 市场影响 {globalPriceModifier, categoryModifiers, productModifiers, locationModifiers, locationProductModifiers, duration}
    forceLocationChange = false, // 强制切换地点
    targetLocation = null, // 目标地点ID
    capacity = 0,       // 背包容量变化
    nextEvent = null,   // 连锁事件ID
    gameState = null    // 游戏状态变化 {gamePaused, forceGameOver, etc.}
  }) {
    this.money = money;
    this.debt = debt;
    this.inventory = inventory;
    this.attributes = attributes;
    this.market = market;
    this.forceLocationChange = forceLocationChange;
    this.targetLocation = targetLocation;
    this.capacity = capacity;
    this.nextEvent = nextEvent;
    this.gameState = gameState;
  }
}

/**
 * 事件条件类
 * 封装事件触发条件的属性
 */
export class EventConditions {
  /**
   * 创建事件条件实例
   * @param {Object} options 条件初始化配置
   */
  constructor({
    minWeek = null,        // 最小周数
    maxWeek = null,        // 最大周数
    locations = null,      // 可触发地点列表
    probability = 1,       // 触发概率
    playerMoney = null,    // 玩家金钱条件 {min, max}
    playerDebt = null,     // 玩家债务条件 {min, max}
    inventoryItems = null, // 背包物品条件 [{productId, minQuantity, maxQuantity}]
    attributes = null,     // 属性条件 {attributeName: {min, max}}
    requiredEvents = null, // 需要已触发的事件列表
    excludedEvents = null, // 需要未触发的事件列表
    customCondition = null // 自定义条件函数 (gameState) => boolean
  }) {
    this.minWeek = minWeek;
    this.maxWeek = maxWeek;
    this.locations = locations;
    this.probability = probability;
    this.playerMoney = playerMoney;
    this.playerDebt = playerDebt;
    this.inventoryItems = inventoryItems;
    this.attributes = attributes;
    this.requiredEvents = requiredEvents;
    this.excludedEvents = excludedEvents;
    this.customCondition = customCondition;
  }
}

// 兼容旧版API的工厂函数
/**
 * 创建事件工厂函数 - OOP风格
 * @param {Object} options 事件初始化选项
 * @returns {Event} 新的事件实例
 */
export function createEvent(options) {
  if (typeof options === 'object' && !Array.isArray(options)) {
    return new Event(options);
  } else {
    // 兼容旧版API
    const [id, title, description, options, conditions, repeatable, type, weight, imageUrl] = arguments;
    return new Event({
      id, title, description, options, conditions, repeatable, type, weight, imageUrl
    });
  }
}

/**
 * 创建事件选项工厂函数 - 兼容旧版API
 * @param {string} text 选项文本
 * @param {string} result 结果文本
 * @param {Object} effects 效果对象
 * @param {Function} condition 选项显示条件
 * @returns {EventOption} 事件选项对象
 */
export const createEventOption = (text, result, effects, condition = null) => {
  return new EventOption({ text, result, effects, condition });
};

/**
 * 创建事件效果对象 - 兼容旧版API
 * @returns {EventEffects} 事件效果对象
 */
export const createEventEffects = (options) => {
  return new EventEffects(options);
};

/**
 * 创建事件触发条件 - 兼容旧版API
 * @returns {EventConditions} 事件触发条件对象
 */
export const createEventConditions = (options) => {
  return new EventConditions(options);
}; 
// 预定义事件列表
const predefinedEvents = [
  // --- 市场事件 ---
  createEvent(
    'market_boom',
    '局部市场繁荣',
    '最新经济报道：高端商城和电子科技城迎来消费热潮，商品价格普遍上涨！这可能是调整购买策略的好时机。',
    [
      createEventOption(
        '抓住机会在热门地区采购',
        '你决定前往这些繁荣地区采购更多商品，希望能从价格波动中获益。',
        createEventEffects({
          market: {
            locationModifiers: {
              'premium_mall': 1.25, // 高端商城价格上涨25%
              'electronics_hub': 1.15 // 电子科技城价格上涨15%
            },
            duration: 2 // 持续2周
          }
        })
      ),
      createEventOption(
        '观望市场走势',
        '你决定保持观望态度，不做任何特别的操作。',
        createEventEffects({})
      ),
      createEventOption(
        '趁高价出售相关库存商品',
        '你决定利用这些地区价格上涨的机会出售一些库存商品。',
        createEventEffects({
          market: { 
            locationModifiers: {
              'premium_mall': 1.2, // 高端商城价格上涨20%
              'electronics_hub': 1.1 // 电子科技城价格上涨10%
            }, 
            duration: 1 // 持续1周
          }
        }),
        (gameState) => gameState.player.inventoryUsed > 0 // 只有当背包中有物品时才显示此选项
      )
    ],
    createEventConditions({
      minWeek: 5, // 至少第5周后触发
      probability: 0.2 // 20%触发概率
    }),
    true, // 可重复触发
    EventType.MARKET, // 事件类型
    1.5, // 权重
    '/assets/images/events/market_boom.jpg' // 事件图片
  ),
  
  createEvent(
    'market_crash',
    '局部市场崩盘',
    '突发消息：二手市场和地下黑市爆发安全事件，导致这些地区交易萎缩，商品价格大幅下跌！你需要决定是否利用这次低价机会。',
    [
      createEventOption(
        '抄底购买',
        '你决定趁低价前往受影响地区大量购入商品，希望能在价格回升时获利。',
        createEventEffects({
          market: {
            locationModifiers: {
              'second_hand_market': 0.65, // 二手市场价格下跌35%
              'black_market': 0.7 // 地下黑市价格下跌30%
            },
            duration: 3 // 持续3周
          }
        })
      ),
      createEventOption(
        '等待市场稳定',
        '你决定等待市场稳定后再行动，避免在动荡时期冒险。',
        createEventEffects({})
      ),
      createEventOption(
        '提前卖出持有商品',
        '你担心其他地区也会受影响，决定立即出售部分商品减少可能的损失。',
        createEventEffects({
          market: {
            locationModifiers: {
              'second_hand_market': 0.75, // 二手市场价格下跌25%
              'black_market': 0.8 // 地下黑市价格下跌20%
            },
            duration: 1 // 持续1周
          }
        }),
        (gameState) => gameState.player.inventoryUsed > 0
      )
    ],
    createEventConditions({
      minWeek: 10,
      probability: 0.15
    }),
    true,
    EventType.MARKET,
    1.5,
    '/assets/images/events/market_crash.jpg'
  ),
  
  // --- 个人事件 ---
  createEvent(
    'lucky_money',
    '意外之财',
    '你在路上捡到了一个钱包，里面有一些现金和失主的联系方式。这是个考验你诚信的时刻。',
    [
      createEventOption(
        '归还钱包',
        '你联系了失主并归还了钱包，对方非常感谢并给了你500元酬金。',
        createEventEffects({
          money: 500,
          attributes: { creditRating: 1, reputation: 1 }
        })
      ),
      createEventOption(
        '据为己有',
        '你决定把钱包里的钱据为己有，获得了2000元，但感到有些愧疚。',
        createEventEffects({ 
          money: 2000,
          attributes: { creditRating: -2, reputation: -2 } 
        })
      )
    ],
    createEventConditions({
      probability: 0.1,
      minWeek: 3
    }),
    false, // 不可重复触发
    EventType.PERSONAL,
    1,
    '/assets/images/events/lucky_money.jpg'
  ),
  
  createEvent(
    'health_problem',
    '健康问题',
    '你突然感到身体不适，医生建议你及时就医。不及时处理可能会影响到你的日常工作和生活。',
    [
      createEventOption(
        '立即就医',
        '你选择立即去医院检查治疗，花费了一些医疗费，但迅速恢复了健康。',
        createEventEffects({ 
          money: -800,
          attributes: { health: 1 }
        })
      ),
      createEventOption(
        '暂时忍耐',
        '你决定先忍着，希望症状会自行好转，省下医疗费用。但这导致你的健康状况有所下降。',
        createEventEffects({
          attributes: { health: -1 }
        })
      ),
      createEventOption(
        '寻求中药调理',
        '你选择购买一些中药进行调理，花费较少但效果温和。',
        createEventEffects({
          money: -300,
          attributes: { health: 0.5 }
        })
      )
    ],
    createEventConditions({
      probability: 0.15,
      minWeek: 8
    }),
    true,
    EventType.PERSONAL,
    1,
    '/assets/images/events/health_problem.jpg'
  ),
  
  // --- 地点事件 ---
  createEvent(
    'market_raid',
    '黑市突袭',
    '警方突然突袭了地下黑市！所有人都在慌乱中逃窜，你需要快速做出决定。',
    [
      createEventOption(
        '迅速离开',
        '你迅速逃离了现场，虽然没能完成交易，但避免了不必要的麻烦。',
        createEventEffects({ 
          forceLocationChange: true,
          targetLocation: 'commodity_market'
        })
      ),
      createEventOption(
        '冒险完成交易',
        '你冒险留下来完成交易，获得了低价商品，但差点被执法人员抓住。',
        createEventEffects({ 
          market: { 
            globalPriceModifier: 0.6, 
            duration: 1
          },
          attributes: { businessSkill: 1, risk_tolerance: 1 }
        })
      )
    ],
    createEventConditions({ 
      locations: ['black_market'],
      probability: 0.25
    }),
    true,
    EventType.LOCATION,
    1.5,
    '/assets/images/events/market_raid.jpg'
  ),
  
  createEvent(
    'celebrity_appearance',
    '名人现身',
    '一位知名明星在高端商城现身购物，引起一阵轰动。人流激增，商家纷纷调高价格。',
    [
      createEventOption(
        '趁机提高售价',
        '你抓住机会在附近设摊，以略高的价格出售商品，赚了一笔。',
        createEventEffects({ 
          money: 1500,
          market: { 
            globalPriceModifier: 1.2, 
            duration: 1
          }
        })
      ),
      createEventOption(
        '尝试接近名人',
        '你试图接近名人获取合影，结果不小心被保安推搡，手机摔坏了。',
        createEventEffects({
          money: -500
        })
      )
    ],
    createEventConditions({ 
      locations: ['premium_mall'],
      probability: 0.2
    }),
    true,
    EventType.LOCATION,
    1,
    '/assets/images/events/celebrity.jpg'
  ),
  
  // --- 债务相关事件 ---
  createEvent(
    'debt_relief',
    '债务减免',
    '银行推出了债务重组计划，你收到了参与机会。这可能是减轻债务负担的好机会。',
    [
      createEventOption(
        '申请参与',
        '你成功申请了债务减免计划，债务减少了20%。',
        createEventEffects({ 
          debt: -0.2 // 债务减少20%（负数表示减少）
        })
      ),
      createEventOption(
        '放弃机会',
        '你认为这可能有隐藏条款，决定放弃这个机会。',
        createEventEffects({})
      )
    ],
    createEventConditions({ 
      minWeek: 15,
      playerDebt: { min: 5000 }, // 债务超过5000才会触发
      probability: 0.3
    }),
    false,
    EventType.PERSONAL,
    1,
    '/assets/images/events/debt_relief.jpg'
  ),
  
  // --- 商品相关事件 ---
  createEvent(
    'electronics_discount',
    '电子产品促销',
    '电子产品市场推出大规模促销活动，价格大幅下降！这是囤积电子产品的好时机。',
    [
      createEventOption(
        '购买电子产品',
        '你趁机购买了一些电子产品，价格比平时便宜很多。',
        createEventEffects({
          market: { 
            categoryModifier: 'ELECTRONICS', 
            modifier: 0.7,
            duration: 2
          }
        })
      ),
      createEventOption(
        '不感兴趣',
        '你对电子产品不感兴趣，决定忽略这次促销。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.15,
      minWeek: 5
    }),
    true,
    EventType.MARKET,
    1,
    '/assets/images/events/electronics_sale.jpg'
  ),
  
  createEvent(
    'luxury_tax',
    '奢侈品征税',
    '政府宣布对奢侈品征收额外税费，导致奢侈品价格全面上涨。',
    [
      createEventOption(
        '提前囤货',
        '你决定在税收政策实施前囤积一些奢侈品，以备后续高价出售。',
        createEventEffects({
          market: { 
            categoryModifier: 'LUXURY', 
            modifier: 1.1,  // 先小幅上涨
            duration: 1
          },
          nextEvent: 'luxury_tax_aftermath'
        })
      ),
      createEventOption(
        '观望市场',
        '你决定等待看看市场如何反应，避免做出冒险决策。',
        createEventEffects({
          market: { 
            categoryModifier: 'LUXURY', 
            modifier: 1.3,  // 直接大幅上涨
            duration: 4
          }
        })
      )
    ],
    createEventConditions({
      probability: 0.1,
      minWeek: 12,
      excludedEvents: ['luxury_tax', 'luxury_tax_aftermath']
    }),
    false,
    EventType.MARKET,
    1,
    '/assets/images/events/luxury_tax.jpg'
  ),
  
  // 连锁事件：奢侈品税收政策后续
  createEvent(
    'luxury_tax_aftermath',
    '奢侈品价格飙升',
    '奢侈品征税政策正式实施，市场价格如预期般大幅上涨。你之前的准备是否充分？',
    [
      createEventOption(
        '高价出售囤货',
        '你将之前囤积的奢侈品以高价出售，获得了可观利润。',
        createEventEffects({
          money: 3000,
          market: { 
            categoryModifier: 'LUXURY', 
            modifier: 1.4,
            duration: 3
          }
        }),
        (gameState) => {
          // 检查背包中是否有奢侈品
          return gameState.player.inventory.some(item => {
            const product = gameState.products.find(p => p.id === item.productId);
            return product && product.category === 'LUXURY';
          });
        }
      ),
      createEventOption(
        '继续持有',
        '你认为价格还会进一步上涨，决定继续持有囤积的商品。',
        createEventEffects({
          market: { 
            categoryModifier: 'LUXURY', 
            modifier: 1.3,
            duration: 3
          }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['luxury_tax']
    }),
    false,
    EventType.MARKET,
    1,
    '/assets/images/events/luxury_price_rise.jpg'
  ),
  
  // --- 背包容量相关事件 ---
  createEvent(
    'storage_expansion',
    '存储空间扩展',
    '你发现一个可以扩展背包容量的好机会，但需要投入一些资金。',
    [
      createEventOption(
        '购买新背包',
        '你花钱购买了一个更大的背包，提升了存储容量。',
        createEventEffects({ 
          money: -1500,
          capacity: 20 // 增加20个背包容量
        })
      ),
      createEventOption(
        '租用仓库空间',
        '你租了一个小型仓库空间，花费较低但容量提升有限。',
        createEventEffects({ 
          money: -500,
          capacity: 10
        })
      ),
      createEventOption(
        '放弃机会',
        '你认为当前容量够用，决定节约资金不进行扩展。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.15,
      minWeek: 10,
      playerMoney: { min: 500 },
      inventoryUsed: { min: 0.7 } // 背包使用率超过70%才触发
    }),
    true,
    EventType.PERSONAL,
    1,
    '/assets/images/events/storage_expansion.jpg'
  ),
  
  // --- 教程事件 ---
  createEvent(
    'tutorial_trading',
    '交易入门',
    '欢迎来到《买房记》！在这个游戏中，你的目标是通过买卖商品赚取差价，最终积累足够的资金购买理想的房产。',
    [
      createEventOption(
        '了解基本交易',
        '你学习了基本的交易知识，明白了如何在不同地点之间买卖商品赚取差价。',
        createEventEffects({
          nextEvent: 'tutorial_market'
        })
      )
    ],
    createEventConditions({
      minWeek: 1,
      maxWeek: 1
    }),
    false,
    EventType.TUTORIAL,
    1,
    '/assets/images/events/tutorial.jpg'
  ),
  
  createEvent(
    'tutorial_market',
    '市场解析',
    '不同地点的商品价格会有差异，同时还会随时间波动。关注价格趋势是获利的关键！',
    [
      createEventOption(
        '继续学习',
        '你了解了价格趋势系统，以及如何利用价格波动获利。',
        createEventEffects({
          nextEvent: 'tutorial_goal'
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['tutorial_trading']
    }),
    false,
    EventType.TUTORIAL,
    1,
    '/assets/images/events/tutorial_market.jpg'
  ),
  
  createEvent(
    'tutorial_goal',
    '游戏目标',
    '游戏中你有52周的时间来积累财富。最终目标是购买一套理想住房，房屋种类从便宜的小公寓到豪华别墅不等。祝你好运！',
    [
      createEventOption(
        '开始游戏',
        '你已经了解了游戏的基本规则，现在可以开始你的买房之旅了！',
        createEventEffects({
          attributes: { businessSkill: 1 }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['tutorial_market']
    }),
    false,
    EventType.TUTORIAL,
    1,
    '/assets/images/events/tutorial_goal.jpg'
  ),
  
  // --- 新增个人事件 ---
  createEvent(
    'unexpected_inheritance',
    '意外继承',
    '你收到一份律师函，一位远房亲戚去世后将一笔资金留给了你。这是个意外之喜！',
    [
      createEventOption(
        '接受继承',
        '你接受了这笔意外之财，获得了一笔可观的资金。',
        createEventEffects({
          money: 5000,
          attributes: { happiness: 1 }
        })
      ),
      createEventOption(
        '捐赠一部分',
        '你决定将一部分继承的钱捐给慈善机构，感觉心情舒畅。',
        createEventEffects({
          money: 3500,
          attributes: { happiness: 2, reputation: 2 }
        })
      )
    ],
    createEventConditions({
      probability: 0.05, // 较低概率
      minWeek: 15
    }),
    false, // 不可重复
    EventType.PERSONAL,
    0.8,
    '/assets/images/events/inheritance.jpg'
  ),
  
  createEvent(
    'business_training',
    '商业培训',
    '你发现一个商业技能培训班的广告，参加可能会提升你的交易能力，但需要付出一定费用和时间。',
    [
      createEventOption(
        '参加培训',
        '你投入时间和金钱参加了培训，商业技能得到了提升。',
        createEventEffects({
          money: -1000,
          attributes: { businessSkill: 2 }
        })
      ),
      createEventOption(
        '自学商业知识',
        '你决定通过书籍和网络自学商业知识，花费较少但效果有限。',
        createEventEffects({
          money: -200,
          attributes: { businessSkill: 1 }
        })
      ),
      createEventOption(
        '忽略这个机会',
        '你认为实践出真知，决定把时间和金钱用在实际交易上。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.15,
      minWeek: 4,
      playerMoney: { min: 1000 }
    }),
    true, // 可重复，但间隔较长
    EventType.PERSONAL,
    1,
    '/assets/images/events/business_training.jpg'
  ),
  
  createEvent(
    'social_networking',
    '社交机会',
    '你被邀请参加一个商业人士的社交聚会，这可能是结识人脉、获取信息的好机会。',
    [
      createEventOption(
        '积极参与',
        '你在聚会上积极社交，结识了几位有价值的商业伙伴，获得了一些市场内幕。',
        createEventEffects({
          money: -300, // 支付参加费用
          attributes: { socialSkill: 1, businessSkill: 0.5 },
          market: { insiderInfo: true, duration: 2 } // 获得2周的市场内幕信息
        })
      ),
      createEventOption(
        '简单出席',
        '你低调地参加了聚会，没有特别的收获，但也开阔了眼界。',
        createEventEffects({
          money: -300,
          attributes: { socialSkill: 0.5 }
        })
      ),
      createEventOption(
        '婉拒邀请',
        '你因为忙于其他事务婉拒了邀请，错过了这次社交机会。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.12,
      minWeek: 8,
      playerMoney: { min: 300 }
    }),
    true,
    EventType.PERSONAL,
    1,
    '/assets/images/events/social_networking.jpg'
  ),
  
  createEvent(
    'investment_opportunity',
    '投资机会',
    '一个朋友向你推荐了一个小型创业公司的投资机会，声称有高回报，但风险未知。',
    [
      createEventOption(
        '大笔投资',
        '你决定投入一大笔资金，希望获得高回报。',
        createEventEffects({
          money: -4000,
          nextEvent: 'investment_result_big'
        })
      ),
      createEventOption(
        '小额投资',
        '你谨慎地投入一小笔资金，降低可能的风险。',
        createEventEffects({
          money: -1500,
          nextEvent: 'investment_result_small'
        })
      ),
      createEventOption(
        '拒绝投资',
        '你对这个机会持怀疑态度，决定不冒险投资。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.1,
      minWeek: 20,
      playerMoney: { min: 4000 }
    }),
    false,
    EventType.PERSONAL,
    1,
    '/assets/images/events/investment_opportunity.jpg'
  ),
  
  // 投资结果事件（大额）
  createEvent(
    'investment_result_big',
    '投资结果',
    '几周后，你投资的创业公司有了新进展...',
    [
      createEventOption(
        '查看结果',
        '你满怀期待地查看投资结果...',
        createEventEffects({
          // 70%概率成功，30%概率失败
          money: Math.random() > 0.3 ? 8000 : -2000,
          attributes: { businessSkill: 1 }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['investment_opportunity']
    }),
    false,
    EventType.PERSONAL,
    1,
    '/assets/images/events/investment_result.jpg'
  ),
  
  // 投资结果事件（小额）
  createEvent(
    'investment_result_small',
    '投资结果',
    '几周后，你投资的创业公司有了新进展...',
    [
      createEventOption(
        '查看结果',
        '你满怀期待地查看投资结果...',
        createEventEffects({
          // 80%概率小赚，20%概率小亏
          money: Math.random() > 0.2 ? 2500 : -500,
          attributes: { businessSkill: 0.5 }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['investment_opportunity']
    }),
    false,
    EventType.PERSONAL,
    1,
    '/assets/images/events/investment_result.jpg'
  ),
  
  // --- 新增市场事件 ---
  createEvent(
    'clothing_fashion_trend',
    '时尚潮流',
    '一股新的时尚潮流席卷全城，服装类产品的需求突然增加！',
    [
      createEventOption(
        '囤积服装类商品',
        '你预见到这是一个商机，决定大量购入服装类商品。',
        createEventEffects({
          market: {
            categoryModifier: 'CLOTHING',
            modifier: 1.3,
            duration: 3
          }
        })
      ),
      createEventOption(
        '观望市场变化',
        '你对时尚潮流持观望态度，决定继续关注市场变化再做决定。',
        createEventEffects({})
      ),
      createEventOption(
        '出售现有服装库存',
        '你决定趁机出售手中的服装类商品，获得一定利润。',
        createEventEffects({
          money: 800
        }),
        (gameState) => {
          // 检查背包中是否有服装类商品
          return gameState.player.inventory.some(item => {
            const product = gameState.products.find(p => p.id === item.productId);
            return product && product.category === 'CLOTHING';
          });
        }
      )
    ],
    createEventConditions({
      probability: 0.15,
      minWeek: 4
    }),
    true,
    EventType.MARKET,
    1,
    '/assets/images/events/fashion_trend.jpg'
  ),
  
  createEvent(
    'food_shortage',
    '食品短缺',
    '由于恶劣天气影响，市场上出现了食品短缺的情况，价格开始上涨。',
    [
      createEventOption(
        '大量购入食品',
        '你预计价格会进一步上涨，决定趁现在大量购入食品类商品。',
        createEventEffects({
          market: {
            categoryModifiers: {
              'FOOD': 1.4  // 修正格式，categoryModifier改为categoryModifiers对象
            },
            productModifiers: {
              '201': 1.6,  // 鸡蛋价格上涨60%
              '202': 1.5,  // 大米价格上涨50%
              '204': 1.7   // 新鲜蔬菜价格上涨70%
            },
            duration: 4
          }
        })
      ),
      createEventOption(
        '寻找替代食品来源',
        '你开始寻找替代的食品来源，避免受到价格波动的影响。',
        createEventEffects({
          market: {
            categoryModifiers: {
              'FOOD': 1.2  // 修正格式，categoryModifier改为categoryModifiers对象
            },
            productModifiers: {
              '201': 1.3,  // 鸡蛋价格上涨30%
              '202': 1.25  // 大米价格上涨25%
            },
            duration: 2
          }
        })
      )
    ],
    createEventConditions({
      probability: 0.12,
      minWeek: 8,
      excludedEvents: ['food_shortage']
    }),
    true,
    EventType.MARKET,
    1,
    '/assets/images/events/food_shortage.jpg'
  ),
  
  createEvent(
    'tech_innovation',
    '科技创新',
    '一项突破性的科技创新引起了市场关注，相关电子产品需求激增。',
    [
      createEventOption(
        '投资科技产品',
        '你决定购入一批最新的科技产品，希望能够获得高额利润。',
        createEventEffects({
          market: {
            categoryModifiers: {
              'ELECTRONICS': 1.25 // 修正格式，categoryModifier改为categoryModifiers对象
            },
            productModifiers: {
              '301': 1.4,   // 手机价格上涨40%
              '303': 1.35,  // 笔记本电脑价格上涨35%
              '305': 1.45   // 智能手表价格上涨45%
            },
            locationModifiers: {
              'electronics_hub': 1.15 // 电子科技城整体价格上涨15%
            },
            duration: 3
          }
        })
      ),
      createEventOption(
        '继续关注传统产品',
        '你认为科技创新只是短期效应，决定继续专注于传统产品。',
        createEventEffects({
          market: {
            // 即使不选择投资，市场也会受到一些影响
            productModifiers: {
              '301': 1.2,  // 手机价格仍然上涨20%
              '305': 1.25  // 智能手表价格上涨25%
            },
            duration: 2
          }
        })
      )
    ],
    createEventConditions({
      probability: 0.15,
      minWeek: 6
    }),
    true,
    EventType.MARKET,
    1,
    '/assets/images/events/tech_innovation.jpg'
  ),
  
  createEvent(
    'supply_chain_disruption',
    '供应链中断',
    '全球供应链出现严重中断，多种商品的供应受到影响，价格开始波动。',
    [
      createEventOption(
        '囤积受影响商品',
        '你决定趁价格还未大幅上涨前，囤积一批受影响的商品。',
        createEventEffects({
          market: {
            globalPriceModifier: 1.15,
            duration: 5 // 更新为周数格式，5周
          }
        })
      ),
      createEventOption(
        '转向本地产品',
        '你决定转向采购本地生产的商品，减少对全球供应链的依赖。',
        createEventEffects({
          market: {
            globalPriceModifier: 1.1,
            duration: 3 // 更新为周数格式，3周
          }
        })
      ),
      createEventOption(
        '延迟采购计划',
        '你决定暂时延迟采购计划，等待供应链恢复正常。',
        createEventEffects({
          nextEvent: 'supply_chain_recovery'
        })
      )
    ],
    createEventConditions({
      probability: 0.1,
      minWeek: 15
    }),
    false,
    EventType.MARKET,
    1.2,
    '/assets/images/events/supply_chain.jpg'
  ),
  
  createEvent(
    'supply_chain_recovery',
    '全球供应链逐步恢复',
    '经过一段时间的调整，全球供应链开始逐步恢复，但不同地区和商品的恢复速度存在显著差异。',
    [
      createEventOption(
        '把握恢复机会',
        '你分析了市场恢复趋势，决定有选择地投资于价格开始恢复正常的商品。',
        createEventEffects({
          market: {
            // 全球市场逐渐回归正常
            globalPriceModifier: 0.95, // 全局价格轻微下调，回归正常
            // 不同地区恢复情况不同
            locationModifiers: {
              'commodity_market': 0.9, // 大宗商品市场恢复较快
              'electronics_hub': 1.1,  // 电子市场恢复较慢
              'black_market': 0.85     // 黑市价格大幅回落
            },
            // 特定商品恢复情况
            locationProductModifiers: {
              'commodity_market': {
                '202': 0.85, // 大米价格回落
                '203': 0.9   // 食用油价格轻微回落
              },
              'electronics_hub': {
                '301': 1.2,  // 手机价格回升
                '305': 1.15  // 智能手表价格小幅回升
              },
              'black_market': {
                '502': 0.7,  // 邮票价格大幅回落
                '503': 0.75  // 古画价格大幅回落
              }
            },
            duration: 3 // 持续3周
          }
        })
      ),
      createEventOption(
        '稳健策略',
        '你决定采取稳健策略，平衡调整你的库存和交易计划。',
        createEventEffects({
          market: {
            globalPriceModifier: 0.98,
            locationModifiers: {
              'commodity_market': 0.95,
              'premium_mall': 0.95,
              'second_hand_market': 0.95
            },
            duration: 2 // 持续2周
          }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['supply_chain_disruption', 'old_supply_chain_disruption'] // 支持新旧两个版本的事件触发
    }),
    false,
    EventType.MARKET,
    1,
    '/assets/images/events/supply_recovery.jpg'
  ),
  
  createEvent(
    'seasonal_sales',
    '季节性促销',
    '年度大促销活动开始了，各大商家纷纷降价吸引顾客。这是囤货的好时机！',
    [
      createEventOption(
        '大量采购',
        '你决定利用促销活动大量采购各类商品，为未来的销售做准备。',
        createEventEffects({
          market: {
            globalPriceModifier: 0.75,
            duration: 2
          }
        })
      ),
      createEventOption(
        '选择性采购',
        '你有选择地购买一些特价商品，避免资金过度占用。',
        createEventEffects({
          market: {
            globalPriceModifier: 0.85,
            duration: 1
          }
        })
      ),
      createEventOption(
        '跳过促销',
        '你认为促销商品质量可能不高，决定跳过这次活动。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.2,
      minWeek: 12,
      maxWeek: 40 // 避免游戏后期触发
    }),
    true,
    EventType.MARKET,
    1,
    '/assets/images/events/seasonal_sales.jpg'
  ),
  
  // --- 新增地点特定事件 ---
  createEvent(
    'market_discount',
    '大宗交易优惠',
    '大宗商品交易所今天推出特别优惠，所有商品都有额外折扣！',
    [
      createEventOption(
        '大量采购',
        '你决定利用这个机会大量采购各类商品，为未来的销售做准备。',
        createEventEffects({
          market: {
            locationModifiers: {
              'commodity_market': 0.8 // 大宗商品交易所整体降价20%
            },
            categoryModifiers: {
              'FOOD': 0.75, // 食品类降价25%
              'DAILY': 0.7  // 日用品降价30%
            },
            productModifiers: {
              '201': 0.6,  // 鸡蛋降价40%
              '202': 0.65, // 大米降价35%
              '101': 0.6   // 卫生纸降价40%
            },
            duration: 1
          },
          forceLocationChange: true,
          targetLocation: 'commodity_market'
        })
      ),
      createEventOption(
        '有选择地购买',
        '你仔细挑选，只购买那些真正划算的商品。',
        createEventEffects({
          market: {
            locationModifiers: {
              'commodity_market': 0.9 // 大宗商品交易所整体降价10%
            },
            productModifiers: {
              '202': 0.7, // 大米降价30%
              '203': 0.75 // 食用油降价25%
            },
            duration: 1
          },
          forceLocationChange: true,
          targetLocation: 'commodity_market'
        })
      ),
      createEventOption(
        '放弃此次机会',
        '你觉得价格优惠幅度不够大，决定不参与此次优惠活动。',
        createEventEffects({
          market: {
            // 即使不参与，市场价格也会有轻微变动
            locationModifiers: {
              'commodity_market': 0.95 // 大宗商品交易所整体轻微降价5%
            },
            duration: 1
          }
        })
      )
    ],
    createEventConditions({
      locations: ['commodity_market'],
      probability: 0.25
    }),
    true,
    EventType.LOCATION,
    1,
    '/assets/images/events/wholesale_discount.jpg'
  ),
  
  createEvent(
    'mall_event',
    '商城名人活动',
    '高端商城举办了一场名人见面会，吸引了大量人流。商场内的商品价格临时上调。',
    [
      createEventOption(
        '趁机设摊销售',
        '你在商城外设置临时摊位，利用人流量增加销售额。',
        createEventEffects({
          money: 1200,
          inventory: [
            { productId: 'random', quantity: -5 } // 随机消耗5个库存商品
          ]
        }),
        (gameState) => gameState.player.inventoryUsed >= 5
      ),
      createEventOption(
        '避开人群',
        '你决定避开拥挤的人群，改天再来购物。',
        createEventEffects({
          forceLocationChange: true
        })
      )
    ],
    createEventConditions({
      locations: ['premium_mall'],
      probability: 0.2
    }),
    true,
    EventType.LOCATION,
    1,
    '/assets/images/events/mall_celebrity.jpg'
  ),
  
  createEvent(
    'electronics_expo',
    '电子科技城展销会',
    '电子科技城举办大型数码产品展销会，最新款手机和智能手表都有特别优惠！这是采购电子产品的绝佳时机。',
    [
      createEventOption(
        '参观展会',
        '你花费一些时间参观展销会，了解最新的科技趋势。',
        createEventEffects({
          money: -100,
          market: {
            // 展会期间电子科技城整体小幅降价
            locationModifiers: {
              'electronics_hub': 0.95
            },
            duration: 1 // 持续1周
          }
        })
      ),
      createEventOption(
        '采购特价电子产品',
        '你决定投资购买展会上的特价手机和智能手表，期望能在价格上涨前转售获利。',
        createEventEffects({
          money: -2000,
          market: {
            // 针对电子科技城的特定产品大幅优惠
            locationProductModifiers: {
              'electronics_hub': {
                '301': 0.7, // 手机降价30%
                '305': 0.75 // 智能手表降价25%
              }
            },
            duration: 2 // 持续2周
          }
        }),
        (gameState) => gameState.player.money >= 2000
      )
    ],
    createEventConditions({
      locations: ['electronics_hub'], // 只在电子科技城触发
      probability: 0.3
    }),
    true,
    EventType.LOCATION,
    1,
    '/assets/images/events/electronics_expo.jpg'
  ),
  
  createEvent(
    'market_inspection',
    '市场检查',
    '市场管理人员突然来到折扣市场进行检查，查验摊位合规性！你需要快速决定如何应对。',
    [
      createEventOption(
        '配合检查',
        '你主动配合检查，展示自己的合规经营，获得了管理人员的好感。',
        createEventEffects({
          money: -50, // 小额罚款或管理费
          attributes: { businessSkill: 1 }
        })
      ),
      createEventOption(
        '暂时离场',
        '你决定暂时收摊离场，避开这次检查，但损失了一天的生意。',
        createEventEffects({
          money: -300,
          attributes: { businessSkill: -1 }
        })
      )
    ],
    createEventConditions({
      locations: ['discount_market'],
      probability: 0.25
    }),
    true,
    EventType.LOCATION,
    1,
    '/assets/images/events/market_inspection.jpg'
  ),
  
  // --- 特殊事件 ---
  createEvent(
    'business_competition',
    '商业竞赛',
    '当地举办了一场商业技能竞赛，测试参赛者的商业头脑和决策能力。这可能是展示你实力的好机会！',
    [
      createEventOption(
        '全力参赛',
        '你决定全力以赴参加比赛，希望能获得好名次。',
        createEventEffects({
          // 根据玩家商业技能决定结果
          money: (gameState) => {
            const businessSkill = gameState.player.attributes.businessSkill || 0;
            if (businessSkill >= 8) return 5000;  // 高技能获得一等奖
            if (businessSkill >= 5) return 2000;  // 中等技能获得二等奖
            if (businessSkill >= 3) return 500;   // 低技能获得参与奖
            return 0;  // 无技能无奖励
          },
          attributes: { businessSkill: 1, reputation: 1 }
        })
      ),
      createEventOption(
        '随便参与',
        '你抱着学习的态度参加比赛，不期望获奖。',
        createEventEffects({
          money: 200, // 参与奖
          attributes: { businessSkill: 0.5 }
        })
      ),
      createEventOption(
        '放弃参赛',
        '你认为自己还没准备好，决定放弃这次比赛机会。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.08,
      minWeek: 25
    }),
    false,
    EventType.PERSONAL,
    1,
    '/assets/images/events/business_competition.jpg'
  ),
  
  createEvent(
    'market_insider_info',
    '内幕消息',
    '你的一个朋友透露给你一个市场内幕消息，暗示某类商品即将大涨价。这可能是一个发财的好机会！',
    [
      createEventOption(
        '相信消息并行动',
        '你相信这个内幕消息，决定投入大量资金购买相关商品。',
        createEventEffects({
          nextEvent: 'insider_info_result'
        })
      ),
      createEventOption(
        '小规模试水',
        '你不确定消息的可靠性，决定小规模投资以降低风险。',
        createEventEffects({
          nextEvent: 'insider_info_result_small'
        })
      ),
      createEventOption(
        '忽略消息',
        '你对这种内幕消息持怀疑态度，决定不采取任何行动。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.1,
      minWeek: 15,
      playerMoney: { min: 3000 }
    }),
    false,
    EventType.MARKET,
    1,
    '/assets/images/events/insider_info.jpg'
  ),
  
  createEvent(
    'insider_info_result',
    '内幕消息结果',
    '一周后，你等待看到内幕消息的结果...',
    [
      createEventOption(
        '查看结果',
        '你满怀期待地查看市场变化。',
        createEventEffects({
          // 70%概率是真消息，30%概率是假消息
          market: Math.random() > 0.3 ? 
            {
              categoryModifier: ['LUXURY', 'ELECTRONICS', 'CLOTHING'][Math.floor(Math.random() * 3)],
              modifier: 1.8,
              duration: 2
            } : 
            {
              globalPriceModifier: 0.9,
              duration: 1
            }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['market_insider_info']
    }),
    false,
    EventType.MARKET,
    1,
    '/assets/images/events/insider_result.jpg'
  ),
  
  createEvent(
    'insider_info_result_small',
    '内幕消息小规模试水结果',
    '一周后，你等待看到内幕消息的结果...',
    [
      createEventOption(
        '查看结果',
        '你查看小规模投资的结果。',
        createEventEffects({
          // 70%概率是真消息，30%概率是假消息，但影响较小
          market: Math.random() > 0.3 ? 
            {
              categoryModifier: ['LUXURY', 'ELECTRONICS', 'CLOTHING'][Math.floor(Math.random() * 3)],
              modifier: 1.5,
              duration: 1
            } : 
            {
              globalPriceModifier: 0.95,
              duration: 1
            }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['market_insider_info']
    }),
    false,
    EventType.MARKET,
    1,
    '/assets/images/events/insider_result.jpg'
  ),
  
  // --- 故事事件和游戏后期事件 ---
  createEvent(
    'real_estate_opportunity',
    '房产机会',
    '你偶然听说有一处房产即将以低于市场价的价格出售，这可能是一个难得的买房机会。',
    [
      createEventOption(
        '立即考察',
        '你决定立即去考察这处房产，看看是否值得购买。',
        createEventEffects({
          nextEvent: 'real_estate_inspection'
        })
      ),
      createEventOption(
        '咨询专业人士',
        '你决定先咨询一位房产专家，获取专业意见。',
        createEventEffects({
          money: -500,
          nextEvent: 'real_estate_expert_advice'
        }),
        (gameState) => gameState.player.money >= 500
      ),
      createEventOption(
        '忽略这个消息',
        '你认为目前还没有准备好购房，决定忽略这个消息。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.1,
      minWeek: 30,
      playerMoney: { min: 50000 } // 确保玩家有一定资金
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/real_estate_opportunity.jpg'
  ),
  
  createEvent(
    'real_estate_inspection',
    '房产考察',
    '你仔细考察了这处房产，发现它确实低于市场价，但需要一些维修。',
    [
      createEventOption(
        '以优惠价购买',
        '你决定抓住这个机会，以优惠价格购买这处房产。',
        createEventEffects({
          money: -60000,
          attributes: { housingValue: 80000 } // 房产实际价值
        }),
        (gameState) => gameState.player.money >= 60000
      ),
      createEventOption(
        '继续等待更好的机会',
        '你认为这处房产不够完美，决定继续等待更好的机会。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      requiredEvents: ['real_estate_opportunity']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/real_estate_inspection.jpg'
  ),
  
  createEvent(
    'real_estate_expert_advice',
    '专家建议',
    '房产专家仔细分析后告诉你，这处房产位置很好，但维修成本可能比预期高。',
    [
      createEventOption(
        '接受建议并购买',
        '你接受专家建议并决定购买这处房产，同时为维修预留资金。',
        createEventEffects({
          money: -65000, // 房价加专家费
          attributes: { housingValue: 85000 } // 房产实际价值
        }),
        (gameState) => gameState.player.money >= 65000
      ),
      createEventOption(
        '放弃这次机会',
        '专家的分析让你意识到风险，你决定放弃这次购房机会。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      requiredEvents: ['real_estate_opportunity']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/real_estate_expert.jpg'
  ),
  
  createEvent(
    'housing_market_boom',
    '房市繁荣',
    '最近房地产市场异常火爆，房价普遍上涨。现在可能是购房或出售现有房产的好时机。',
    [
      createEventOption(
        '抓紧购房',
        '你认为房价还会继续上涨，决定趁现在抓紧购房。',
        createEventEffects({
          market: {
            houseMarketModifier: 1.1, // 房价上涨10%
            duration: 4
          }
        })
      ),
      createEventOption(
        '出售现有房产',
        '你决定趁房价高点出售现有房产，获得可观利润。',
        createEventEffects({
          money: (gameState) => {
            // 如果玩家有房产，则获得额外15%收益
            const housingValue = gameState.player.attributes.housingValue || 0;
            return housingValue * 1.15;
          },
          attributes: { housingValue: 0 } // 出售后没有房产
        }),
        (gameState) => gameState.player.attributes.housingValue > 0
      ),
      createEventOption(
        '观望市场',
        '你认为目前房价过高，可能是泡沫，决定继续观望。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.1,
      minWeek: 35
    }),
    true,
    EventType.MARKET,
    1,
    '/assets/images/events/housing_boom.jpg'
  ),
  
  createEvent(
    'housing_market_crash',
    '房市崩盘',
    '突发经济危机导致房地产市场急剧降温，房价开始下跌。这可能是低价购入的机会，也可能带来风险。',
    [
      createEventOption(
        '逆势购房',
        '你认为这是难得的低价购房机会，决定逆势而上。',
        createEventEffects({
          market: {
            houseMarketModifier: 0.8, // 房价下降20%
            duration: 3
          }
        })
      ),
      createEventOption(
        '观望市场',
        '你决定等待市场进一步稳定后再做决定。',
        createEventEffects({
          market: {
            houseMarketModifier: 0.85, // 房价下降15%
            duration: 2
          }
        })
      )
    ],
    createEventConditions({
      probability: 0.08,
      minWeek: 40,
      excludedEvents: ['housing_market_boom']
    }),
    false,
    EventType.MARKET,
    1,
    '/assets/images/events/housing_crash.jpg'
  ),
  
  createEvent(
    'business_partner_proposal',
    '商业合作提议',
    '一位经验丰富的商人提议与你合作开展更大规模的贸易，但需要你投入一笔资金作为启动资本。',
    [
      createEventOption(
        '接受合作',
        '你决定与这位商人合作，投入一笔资金开展大规模贸易。',
        createEventEffects({
          money: -10000,
          nextEvent: 'business_partnership_result'
        }),
        (gameState) => gameState.player.money >= 10000
      ),
      createEventOption(
        '小规模试水',
        '你对合作持谨慎态度，决定先小规模投资测试。',
        createEventEffects({
          money: -3000,
          nextEvent: 'business_partnership_small_result'
        }),
        (gameState) => gameState.player.money >= 3000
      ),
      createEventOption(
        '拒绝合作',
        '你对这个合作提议持怀疑态度，决定婉拒。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.1,
      minWeek: 30,
      playerMoney: { min: 10000 },
      attributes: { businessSkill: { min: 5 } }
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/business_partner.jpg'
  ),
  
  createEvent(
    'business_partnership_result',
    '商业合作结果',
    '几周过去了，你与商业伙伴的合作项目有了结果...',
    [
      createEventOption(
        '查看结果',
        '你期待地查看合作的成果。',
        createEventEffects({
          // 根据玩家的商业技能决定回报
          money: (gameState) => {
            const businessSkill = gameState.player.attributes.businessSkill || 0;
            const baseReturn = 15000; // 基础回报
            const skillBonus = businessSkill * 1000; // 技能加成
            return baseReturn + skillBonus;
          },
          attributes: { businessSkill: 2 }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['business_partner_proposal']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/partnership_result.jpg'
  ),
  
  createEvent(
    'business_partnership_small_result',
    '小规模合作结果',
    '几周过去了，你的小规模合作项目有了结果...',
    [
      createEventOption(
        '查看结果',
        '你查看小规模合作的成果。',
        createEventEffects({
          // 较小规模的回报
          money: (gameState) => {
            const businessSkill = gameState.player.attributes.businessSkill || 0;
            const baseReturn = 4500; // 基础回报
            const skillBonus = businessSkill * 300; // 技能加成
            return baseReturn + skillBonus;
          },
          attributes: { businessSkill: 1 }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['business_partner_proposal']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/partnership_result.jpg'
  ),
  
  createEvent(
    'final_opportunity',
    '最终机会',
    '游戏接近尾声，市场出现了一次难得的价格波动，这可能是你最后的发财机会！',
    [
      createEventOption(
        '全力投入',
        '你决定将大部分资金投入到这次机会中，希望能实现最后的翻盘。',
        createEventEffects({
          market: {
            globalPriceModifier: 0.6, // 商品价格大幅下降
            duration: 1
          },
          nextEvent: 'final_market_surge'
        })
      ),
      createEventOption(
        '谨慎投资',
        '你决定谨慎投资，避免在最后关头冒过大风险。',
        createEventEffects({
          market: {
            globalPriceModifier: 0.8,
            duration: 1
          }
        })
      )
    ],
    createEventConditions({
      minWeek: 45, // 接近游戏结束
      probability: 0.5 // 高概率触发
    }),
    false,
    EventType.STORY,
    2,
    '/assets/images/events/final_opportunity.jpg'
  ),
  
  createEvent(
    'final_market_surge',
    '最终市场大涨',
    '就在游戏即将结束前，市场出现了戏剧性的价格上涨！这是最后的变现机会。',
    [
      createEventOption(
        '全部卖出',
        '你决定趁这次价格上涨全部卖出库存，最大化你的利润。',
        createEventEffects({
          market: {
            globalPriceModifier: 2.0, // 价格翻倍
            duration: 1
          }
        })
      ),
      createEventOption(
        '部分卖出',
        '你决定卖出部分库存，保留一些以防后市继续上涨。',
        createEventEffects({
          market: {
            globalPriceModifier: 1.7, // 价格上涨但幅度较小
            duration: 1
          }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['final_opportunity'],
      minWeek: 48 // 游戏最后几周
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/market_surge.jpg'
  ),
  
  // --- 特殊彩蛋事件已移除 ---

  // ============ 房产连锁事件系列 ============
  
  // 1. 房产展览会事件链
  createEvent(
    'property_expo',
    '房产展览会',
    '城市中心正在举办一场大型房产展览会，各个开发商都带来了他们最新的楼盘项目。这是了解市场动态和获取优惠信息的好机会。',
    [
      createEventOption(
        '参观展览会',
        '你决定花时间参观房产展览会，了解市场最新动态。',
        createEventEffects({
          money: -200, // 门票和交通费用
          nextEvent: 'property_expo_discover'
        }),
        (gameState) => gameState.player.money >= 200
      ),
      createEventOption(
        '与中介交谈',
        '你决定只与几位房产中介交谈，不花太多时间。',
        createEventEffects({
          nextEvent: 'property_broker_info'
        })
      ),
      createEventOption(
        '忽略这个活动',
        '你现在没有购房计划，决定忽略这次展览会。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.15,
      minWeek: 15, // 游戏中期才会触发
      playerMoney: { min: 30000 } // 确保玩家有一定资金才会触发
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/property_expo.jpg'
  ),

  createEvent(
    'property_expo_discover',
    '展会发现',
    '在展览会上，你发现一个正在预售的新楼盘，开发商提供了独特的折扣方案。销售人员告诉你，如果现在预订，可以获得比市场价低15%的优惠。',
    [
      createEventOption(
        '预付定金',
        '你决定抓住这个机会，预付10%的定金锁定这个优惠。',
        createEventEffects({
          money: (gameState) => -10000, // 假设定金是10000
          nextEvent: 'property_investment_result'
        }),
        (gameState) => gameState.player.money >= 10000
      ),
      createEventOption(
        '记录信息',
        '你记下了这个楼盘的信息，但决定先不付定金，回去再考虑。',
        createEventEffects({
          nextEvent: 'property_later_decision'
        })
      ),
      createEventOption(
        '寻找其他机会',
        '你对这个楼盘不太感兴趣，决定继续寻找其他机会。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      requiredEvents: ['property_expo']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/property_discover.jpg'
  ),

  createEvent(
    'property_investment_result',
    '房产投资结果',
    '几周后，你收到开发商的通知，你预订的楼盘项目进展顺利，已经开始正式建设。根据最新的市场评估，类似房产的价值已经上涨了。',
    [
      createEventOption(
        '继续持有',
        '你决定继续持有这项投资，期待房产完工后的升值。',
        createEventEffects({
          attributes: { housingInvestment: 10000, propertyValue: 100000 },
          nextEvent: 'property_completion_notice'
        })
      ),
      createEventOption(
        '转让投资',
        '你决定趁着市场上涨，将你的预购权转让给其他买家，获取快速利润。',
        createEventEffects({
          money: 13000, // 获得13000的现金（本金10000+利润3000）
          attributes: { housingInvestment: 0, propertyValue: 0 }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['property_expo_discover']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/property_investment.jpg'
  ),

  createEvent(
    'property_completion_notice',
    '房产完工通知',
    '你收到了开发商的通知，你投资的房产项目已经完工，现在价值约120,000元。你可以选择支付剩余的购房款完成购买，或者出售你的预购权。',
    [
      createEventOption(
        '完成购买',
        '你决定支付剩余的购房款，完成这处房产的购买。',
        createEventEffects({
          money: -90000, // 剩余购房款
          attributes: { housingInvestment: 0, propertyValue: 120000, hasHouse: true },
          nextEvent: 'new_house_celebration'
        }),
        (gameState) => gameState.player.money >= 90000
      ),
      createEventOption(
        '出售预购权',
        '你决定出售你的预购权，获取投资回报。',
        createEventEffects({
          money: 25000, // 获得25000的现金（大幅高于原始投资）
          attributes: { housingInvestment: 0, propertyValue: 0 }
        })
      ),
      createEventOption(
        '继续等待',
        '你认为房产价值还会上涨，决定继续持有，但暂不付款。',
        createEventEffects({
          nextEvent: 'property_market_change'
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['property_investment_result'],
      minWeek: 35 // 游戏后期才会触发
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/property_completion.jpg'
  ),

  createEvent(
    'property_market_change',
    '房产市场变化',
    '由于市场条件变化，你持有的房产预购权价值出现了波动。',
    [
      createEventOption(
        '查看市场变化',
        '你密切关注市场动态，查看你的投资受到了什么影响。',
        createEventEffects({
          // 50%概率升值，50%概率贬值
          attributes: { propertyValue: Math.random() > 0.5 ? 130000 : 110000 }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['property_completion_notice']
    }),
    false,
    EventType.MARKET,
    1,
    '/assets/images/events/market_change.jpg'
  ),

  createEvent(
    'new_house_celebration',
    '新房庆祝',
    '你终于拥有了自己的房产！这是人生的一个重要里程碑。朋友们提议举办一个小型聚会来庆祝这一时刻。',
    [
      createEventOption(
        '举办庆祝派对',
        '你决定举办一个庆祝派对，邀请朋友们一起分享这个喜悦时刻。',
        createEventEffects({
          money: -2000, // 派对费用
          attributes: { happiness: 5, socialNetwork: 2 }
        }),
        (gameState) => gameState.player.money >= 2000
      ),
      createEventOption(
        '简单庆祝',
        '你决定简单地请几个好友吃顿饭庆祝一下。',
        createEventEffects({
          money: -500,
          attributes: { happiness: 3 }
        }),
        (gameState) => gameState.player.money >= 500
      ),
      createEventOption(
        '独自欣赏',
        '你决定独自一人好好欣赏你的新家，享受这份成就感。',
        createEventEffects({
          attributes: { happiness: 2 }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['property_completion_notice']
    }),
    false,
    EventType.PERSONAL,
    1,
    '/assets/images/events/house_celebration.jpg'
  ),

  createEvent(
    'property_broker_info',
    '房产中介信息',
    '与房产中介交谈后，你获得了一些关于当前房市的内部信息。中介表示，某些特定区域的房产可能即将升值。',
    [
      createEventOption(
        '深入了解',
        '你决定与中介进一步交流，了解更多细节。',
        createEventEffects({
          money: -500, // 给中介的咨询费
          nextEvent: 'property_insider_tip'
        }),
        (gameState) => gameState.player.money >= 500
      ),
      createEventOption(
        '保持关注',
        '你对这些信息表示感谢，但决定暂时只是保持关注。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      requiredEvents: ['property_expo']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/broker_info.jpg'
  ),

  createEvent(
    'property_insider_tip',
    '内部消息',
    '支付咨询费后，中介向你透露了一个内部消息：城市规划部门即将宣布在某区域建设新的地铁线，这很可能导致该区域房价上涨。',
    [
      createEventOption(
        '投资该区域房产',
        '你决定相信这个消息，投资该区域的房产。',
        createEventEffects({
          money: -30000, // 投资成本
          nextEvent: 'property_insider_result'
        }),
        (gameState) => gameState.player.money >= 30000
      ),
      createEventOption(
        '谨慎观望',
        '你对这个消息持谨慎态度，决定先观察一段时间。',
        createEventEffects({
          nextEvent: 'property_missed_opportunity'
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['property_broker_info']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/insider_tip.jpg'
  ),

  createEvent(
    'property_insider_result',
    '内部消息结果',
    '几周后，城市规划部门果然宣布了新地铁线的建设计划，你投资的区域房产价值开始上涨！',
    [
      createEventOption(
        '继续持有',
        '你决定继续持有这项投资，期待更大的升值空间。',
        createEventEffects({
          attributes: { propertyValue: 45000 } // 当前估值
        })
      ),
      createEventOption(
        '立即出售',
        '你决定趁着消息公布后的价格上涨立即出售获利。',
        createEventEffects({
          money: 40000, // 获得40000现金（投资回报约33%）
          attributes: { propertyValue: 0 }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['property_insider_tip']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/insider_result.jpg'
  ),

  createEvent(
    'property_missed_opportunity',
    '错失机会',
    '城市规划部门宣布了新地铁线的建设计划，中介提到的区域房价果然上涨了。你有些遗憾没有把握这个投资机会。',
    [
      createEventOption(
        '寻找新机会',
        '错过了这次机会，但你决定继续寻找新的投资机会。',
        createEventEffects({
          nextEvent: 'property_new_opportunity'
        })
      ),
      createEventOption(
        '接受教训',
        '你接受这个教训，决定以后在有内部消息时更加果断。',
        createEventEffects({
          attributes: { businessSkill: 1 }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['property_insider_tip']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/missed_opportunity.jpg'
  ),

  createEvent(
    'property_new_opportunity',
    '新的房产机会',
    '尽管错过了之前的机会，但你很快发现了另一个潜在的房产投资机会。一处位置较好但略显老旧的房产正在出售，价格相对较低。',
    [
      createEventOption(
        '购买并翻新',
        '你决定购买这处房产并进行翻新，提升其价值。',
        createEventEffects({
          money: -40000, // 购买和初步翻新费用
          attributes: { propertyValue: 40000 },
          nextEvent: 'property_renovation_results'
        }),
        (gameState) => gameState.player.money >= 40000
      ),
      createEventOption(
        '仅购买不翻新',
        '你决定购买这处房产，但暂不进行翻新。',
        createEventEffects({
          money: -35000, // 仅购买费用
          attributes: { propertyValue: 35000 }
        }),
        (gameState) => gameState.player.money >= 35000
      ),
      createEventOption(
        '放弃这个机会',
        '经过评估，你认为这个机会风险太大，决定放弃。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      requiredEvents: ['property_missed_opportunity']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/new_opportunity.jpg'
  ),

  createEvent(
    'property_renovation_results',
    '房产翻新结果',
    '经过一段时间的翻新，你的房产焕然一新。周边邻居和房产评估师都对你的翻新工作表示赞赏。',
    [
      createEventOption(
        '查看房产估值',
        '你请房产评估师对翻新后的房产进行正式估值。',
        createEventEffects({
          money: -500, // 评估费
          attributes: { propertyValue: 55000 } // 翻新后的估值
        }),
        (gameState) => gameState.player.money >= 500
      ),
      createEventOption(
        '挂牌出售',
        '你决定将翻新后的房产立即挂牌出售。',
        createEventEffects({
          nextEvent: 'property_sale_result'
        })
      ),
      createEventOption(
        '继续持有',
        '你决定暂时继续持有这处房产，观察市场变化。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      requiredEvents: ['property_new_opportunity']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/renovation_results.jpg'
  ),

  createEvent(
    'property_sale_result',
    '房产出售结果',
    '经过几周的挂牌，你的房产终于找到了买家。买家对房子的状况非常满意，愿意支付一个不错的价格。',
    [
      createEventOption(
        '接受报价',
        '你决定接受买家的报价，完成房产交易。',
        createEventEffects({
          money: 60000, // 卖出价格
          attributes: { propertyValue: 0, businessSkill: 2 }
        })
      ),
      createEventOption(
        '继续等待更高报价',
        '你认为房产价值更高，决定拒绝当前报价，继续等待。',
        createEventEffects({
          nextEvent: 'property_price_negotiation'
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['property_renovation_results']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/sale_result.jpg'
  ),

  createEvent(
    'property_price_negotiation',
    '房价谈判',
    '在拒绝了第一位买家的报价后，又有新买家对你的房产表示了兴趣，双方开始了价格谈判。',
    [
      createEventOption(
        '坚持要价',
        '你坚持自己的定价，表示这是最终价格。',
        createEventEffects({
          // 50%几率获得更高价格，50%几率交易失败
          money: Math.random() > 0.5 ? 65000 : 0,
          attributes: Math.random() > 0.5 ? { propertyValue: 0, businessSkill: 3 } : { businessSkill: 1 }
        })
      ),
      createEventOption(
        '适当让步',
        '你决定在价格上适当让步，以确保交易成功。',
        createEventEffects({
          money: 58000, // 略低于理想价格
          attributes: { propertyValue: 0, businessSkill: 1 }
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['property_sale_result']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/price_negotiation.jpg'
  ),

  createEvent(
    'property_later_decision',
    '延迟购房决定',
    '在记录了楼盘信息后，你一直在考虑是否应该投资这个项目。最近，你注意到该项目的市场反响很好，销售进展迅速。',
    [
      createEventOption(
        '现在投资',
        '你决定不再犹豫，立即投资这个项目，尽管价格已经略有上涨。',
        createEventEffects({
          money: -12000, // 定金已上涨
          nextEvent: 'property_investment_result'
        }),
        (gameState) => gameState.player.money >= 12000
      ),
      createEventOption(
        '放弃这个项目',
        '你决定放弃这个项目，继续寻找其他投资机会。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      requiredEvents: ['property_expo_discover']
    }),
    false,
    EventType.STORY,
    1,
    '/assets/images/events/later_decision.jpg'
  ),

  createEvent(
    'bag_expansion_opportunity',
    '背包扩展机会',
    '你遇到一个旅行用品店，店主正在出售一款特制的高容量背包，看起来很实用。',
    [
      createEventOption(
        '购买高级背包',
        '你购买了高级背包，现在你可以携带更多物品了。',
        createEventEffects({
          money: -5000, // 花费5000元
          capacity: 20  // 增加20单位背包容量
        }),
        (gameState) => gameState.player.money >= 5000
      ),
      createEventOption(
        '购买普通背包',
        '你购买了一个普通背包，略微增加了携带容量。',
        createEventEffects({
          money: -2000, // 花费2000元
          capacity: 10  // 增加10单位背包容量
        }),
        (gameState) => gameState.player.money >= 2000
      ),
      createEventOption(
        '放弃购买',
        '你决定暂时不购买新背包。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.8,
      playerMoney: { min: 3000 } // 玩家至少有2000元才会触发
    }),
    false, // 不可重复触发
    EventType.RANDOM,
    2, // 高权重
    '/assets/images/events/bag_expansion.jpg'
  ),

  createEvent(
    'market_price_surge',
    '奢侈品与收藏品价格飙升',
    '最新财经报道：随着富裕阶层消费回暖，高端商城的奢侈品和地下黑市的稀有收藏品价格大幅上涨，其中尤以名表和古董涨幅最大。',
    [
      createEventOption(
        '调整投资策略',
        '你仔细分析了价格波动趋势，决定调整你的交易策略，重点关注高端商品。',
        createEventEffects({
          market: {
            // 全局价格小幅上涨
            globalPriceModifier: 1.05,
            // 特定地区价格上涨更明显
            locationModifiers: {
              'premium_mall': 1.15, // 高端商城整体上涨15%
              'black_market': 1.2   // 地下黑市整体上涨20%
            },
            // 特定地区特定商品上涨最明显
            locationProductModifiers: {
              'premium_mall': {
                '401': 1.5   // 高端商城的名表上涨50%
              },
              'black_market': {
                '503': 1.6   // 地下黑市的古画上涨60%
              }
            },
            // 持续两周
            duration: 2 // 持续2周
          }
        })
      ),
      createEventOption(
        '前往高端市场',
        '你决定立即前往高端商城和地下黑市，希望能在价格进一步上涨前采购一些潜力商品。',
        createEventEffects({
          forceLocationChange: true,
          targetLocation: 'premium_mall',
          market: {
            locationProductModifiers: {
              'premium_mall': {
                '401': 1.3   // 高端商城的名表上涨30%
              },
              'black_market': {
                '503': 1.4   // 地下黑市的古画上涨40%
              }
            },
            duration: 1 // 持续1周
          }
        })
      )
    ],
    createEventConditions({
      probability: 0.3,
      minWeek: 8
    }),
    true, // 可重复触发
    EventType.MARKET,
    1,
    '/assets/images/events/price_surge.jpg'
  ),

  createEvent(
    'market_price_drop',
    '市场价格下跌',
    '全球经济出现波动，导致多个市场的商品价格出现下跌趋势。',
    [
      createEventOption(
        '观察市场',
        '你决定观察市场动向，寻找低价购入的机会。',
        createEventEffects({
          market: {
            // 全局价格下跌15%
            globalPriceModifier: 0.85,
            // 持续一周
            duration: 1 // 持续1周
          }
        })
      )
    ],
    createEventConditions({
      probability: 0.7
    }),
    true, // 可重复触发
    EventType.MARKET,
    1,
    '/assets/images/events/price_drop.jpg'
  ),

  createEvent(
    'property_investment_chance',
    '房产投资机会',
    '你听说一个新兴区域正在开发，现在购买房产可能会有不错的升值空间。',
    [
      createEventOption(
        '投资房产',
        '你决定投资这个新兴区域的房产项目。',
        createEventEffects({
          money: -30000, // 投资30000元
          attributes: { 
            housingInvestment: 30000, // 记录房产投资
            propertyValue: 30000 // 初始房产价值
          },
          nextEvent: 'property_investment_result' // 链接到后续事件
        }),
        (gameState) => gameState.player.money >= 30000
      ),
      createEventOption(
        '谨慎观望',
        '你觉得目前时机不成熟，决定继续观望。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      minWeek: 10, // 至少游戏进行10周后才会触发
      playerMoney: { min: 30000 } // 玩家资金至少30000元
    }),
    false, // 不可重复触发
    EventType.STORY,
    1,
    '/assets/images/events/property_investment.jpg'
  ),

  createEvent(
    'financial_advisor',
    '理财顾问',
    '你遇到了一位专业的理财顾问，他愿意为你提供一些投资建议。',
    [
      createEventOption(
        '咨询建议',
        '你支付咨询费，获得了一些关于当前市场的专业建议。',
        createEventEffects({
          money: -1000, // 咨询费
          // 某些商品价格信息会更准确
          market: {
            productModifiers: {
              'house_a': 1.05, // 特定房产价格微调
              'house_b': 0.95,
              'land_a': 1.1
            },
            duration: 604800 // 一周
          }
        }),
        (gameState) => gameState.player.money >= 1000
      ),
      createEventOption(
        '委托投资',
        '你决定委托他进行一些小额投资。',
        createEventEffects({
          money: -3000, // 降低投资金额，避免初期资金不足
          nextEvent: 'financial_advisor_result' // 链接到后续事件
        }),
        (gameState) => gameState.player.money >= 3000 // 确保玩家有足够资金
      ),
      createEventOption(
        '婉拒',
        '你礼貌地拒绝了他的建议。',
        createEventEffects({})
      )
    ],
    createEventConditions({
      probability: 0.6,
      minWeek: 5
    }),
    true, // 可重复触发
    EventType.RANDOM,
    1,
    '/assets/images/events/financial_advisor.jpg'
  ),

  createEvent(
    'financial_advisor_result',
    '投资结果',
    '你之前委托理财顾问进行的投资有了结果。',
    [
      createEventOption(
        '查看结果',
        // 随机生成投资结果，70%概率盈利，30%概率亏损
        Math.random() < 0.7 ? 
          '你的投资取得了不错的回报，获得了4000元。' : 
          '很遗憾，由于市场波动，你的投资出现了亏损，只收回了2000元。',
        createEventEffects({
          // 70%概率获得4000元(盈利1000)，30%概率获得2000元(亏损1000)
          money: Math.random() < 0.7 ? 4000 : 2000
        })
      )
    ],
    createEventConditions({
      requiredEvents: ['financial_advisor']
    }),
    false, // 不可重复触发
    EventType.STORY,
    1,
    '/assets/images/events/investment_result.jpg'
  ),
  
  // 供应链中断事件
  createEvent({
    id: 'supply_chain_disruption',
    title: '全球供应链中断危机',
    description: '突发新闻：全球贸易遭遇严重供应链中断！各地区不同商品价格出现剧烈波动，部分商品短缺涨价，部分商品积压降价。此次危机预计将对市场产生深远影响。',
    type: EventType.MARKET,
    options: [
      createEventOption(
        '在大宗市场囤积基本物资', 
        '你预判到基本生活物资将会短缺，决定前往大宗商品交易所囤积必需品。',
        {
          market: {
            // 全局市场轻微波动
            globalPriceModifier: 1.05,
            // 大宗商品交易所的物资价格变化
            locationProductModifiers: {
              'commodity_market': {
                '202': 1.6, // 大米价格上涨60%
                '203': 1.5, // 食用油价格上涨50%
                '101': 1.4  // 卫生纸价格上涨40%
              },
              'electronics_hub': {
                '301': 0.7, // 手机降价30%（电子产品积压）
                '305': 0.75 // 智能手表降价25%
              },
              'premium_mall': {
                '404': 0.8 // 高级香水降价20%（奢侈品销售下滑）
              }
            },
            duration: 4 // 持续4周
          },
          forceLocationChange: true,
          targetLocation: 'commodity_market'
        }
      ),
      createEventOption(
        '投资受影响商品', 
        '你认为这是投资低价电子产品的好机会，决定前往电子科技城大量购入。',
        {
          market: {
            locationModifiers: {
              'electronics_hub': 0.85 // 电子科技城整体降价15%
            },
            locationProductModifiers: {
              'electronics_hub': {
                '301': 0.6, // 手机降价40%
                '305': 0.65 // 智能手表降价35%
              },
              'commodity_market': {
                '202': 1.45, // 大米价格上涨45%
                '203': 1.4  // 食用油价格上涨40%
              }
            },
            duration: 3 // 持续3周
          },
          forceLocationChange: true,
          targetLocation: 'electronics_hub'
        }
      ),
      createEventOption(
        '寻找黑市稀缺资源', 
        '你猜测某些特殊商品可能在黑市变得更加稀缺且价值上升，决定前往地下黑市探索机会。',
        {
          market: {
            locationModifiers: {
              'black_market': 1.2 // 黑市整体涨价20%
            },
            locationProductModifiers: {
              'black_market': {
                '502': 1.8, // 邮票价格上涨80%（收藏品价值飙升）
                '503': 1.9  // 古画价格上涨90%
              },
              'second_hand_market': {
                '107': 0.7, // 二手物品降价30%（需求下降）
                '106': 0.75 // 二手物品降价25%
              }
            },
            duration: 3 // 持续3周
          },
          forceLocationChange: true,
          targetLocation: 'black_market'
        }
      ),
      createEventOption(
        '保持观望', 
        '你决定暂时不介入这次混乱的市场波动，等待形势更加明朗。',
        {
          // 仅记录市场变化，但不采取行动
          market: {
            globalPriceModifier: 1.02,
            duration: 2 // 持续2周
          }
        }
      )
    ],
    conditions: {
      probability: 0.15, // 较低概率触发，因为是重大事件
      minWeek: 15        // 游戏进行到中后期才会触发
    },
    repeatable: false,   // 重大事件，不可重复触发
    weight: 3           // 较高权重，优先触发
  }),
  
  // 对比事件：地区繁荣与萧条
  createEvent({
    id: 'market_contrast_event',
    title: '城市区域发展不均',
    description: '最新城市规划调整导致电子科技城获得大量投资和客流，而地下黑市却因管控加强而客流锐减。这种发展不均衡引发了明显的市场差异。',
    type: EventType.MARKET,
    options: [
      createEventOption(
        '分析市场机会', 
        '你仔细分析了城市不同区域的发展变化，寻找其中的交易机会。',
        {
          market: {
            // 对比效应：一个地区繁荣（降价），另一个萧条（涨价）
            locationModifiers: {
              'electronics_hub': 0.8, // 电子科技城繁荣，整体降价20%
              'black_market': 1.4 // 地下黑市萧条，整体涨价40%
            },
            duration: 5 // 持续5周
          }
        }
      )
    ],
    conditions: {
      probability: 0.2,
      minWeek: 12
    },
    repeatable: true,
    weight: 2
  })
];

// 事件缓存，避免重复创建事件实例
let eventsCache = [];

// 按类型划分的事件列表
const tutorialEvents = []; // 教程事件
const randomEvents = [];   // 随机事件
const locationEvents = []; // 地点特定事件
const marketEvents = [];   // 市场事件
const personalEvents = []; // 个人事件
const storyEvents = [];    // 故事/剧情事件

// 从预定义事件数据中填充事件列表
function initializeEventLists() {
  // 如果事件列表已经初始化，则跳过
  if (tutorialEvents.length > 0) return;
  
  // 遍历预定义事件数据，按类型分类
  predefinedEvents.forEach(eventData => {
    // 确保事件选项是EventOption实例
    const options = eventData.options.map(option => {
      if (!(option instanceof EventOption)) {
        return new EventOption(option);
      }
      return option;
    });
    
    // 创建Event实例
    const event = new Event({
      ...eventData,
      options,
      imageUrl: eventData.imageUrl || (typeof eventData[8] === 'string' ? eventData[8] : null)
    });
    
    // 根据事件类型添加到对应列表
    switch (event.type) {
      case EventType.TUTORIAL:
        tutorialEvents.push(event);
        break;
      case EventType.RANDOM:
        randomEvents.push(event);
        break;
      case EventType.LOCATION:
        locationEvents.push(event);
        break;
      case EventType.MARKET:
        marketEvents.push(event);
        break;
      case EventType.PERSONAL:
        personalEvents.push(event);
        break;
      case EventType.STORY:
        storyEvents.push(event);
        break;
      default:
        randomEvents.push(event); // 默认添加到随机事件列表
    }
  });
}

/**
 * 获取所有游戏事件
 * @returns {Array<Event>} 事件列表
 */
export function getAllEvents() {
  // 初始化事件列表
  initializeEventLists();
  
  // 从缓存中获取事件，避免重新创建
  if (eventsCache.length > 0) {
    return eventsCache;
  }
  
  // 初始化事件列表
  const events = [];
  
  // 添加教程事件
  events.push(...tutorialEvents);
  
  // 添加随机事件
  events.push(...randomEvents);
  
  // 添加地点特定事件
  events.push(...locationEvents);
  
  // 添加市场事件
  events.push(...marketEvents);
  
  // 添加个人事件
  events.push(...personalEvents);
  
  // 添加故事事件
  events.push(...storyEvents);
  
  // 添加新的地区特定价格事件
  events.push(
    // 地区整体通胀事件
    createEvent({
      id: 'location_inflation_electronics_hub',
      title: '电子科技城芯片短缺',
      description: '最新消息：电子科技城的主要芯片供应商工厂停产，导致该地区电子产品整体涨价。分析师预计这种情况将持续数周。',
      type: EventType.MARKET,
      options: [
        createEventOption(
          '了解情况', 
          '你记下了这个信息，这可能影响你在电子科技城的交易策略。',
          {
            market: {
              // 对电子科技城整体价格上调30%
              locationModifiers: {
                'electronics_hub': 1.3
              },
              duration: 4 // 持续4周
            }
          }
        )
      ],
      conditions: {
        probability: 0.3,
        minWeek: 5
      },
      repeatable: true,
      weight: 2
    }),
    
    // 地区特定商品价格变化事件
    createEvent({
      id: 'premium_mall_luxury_watch_discount',
      title: '高端商城名表促销',
      description: '高端商城的名表专柜开始大规模促销活动，所有品牌手表都有特别折扣。这是购买奢侈手表的好机会！',
      type: EventType.MARKET,
      options: [
        createEventOption(
          '记下信息', 
          '你记下了这个促销信息，可以考虑去高端商城购买手表。',
          {
            market: {
              // 对高端商城的特定商品(ID:401手表)降价40%
              locationProductModifiers: {
                'premium_mall': {
                  '401': 0.6 // 降价40%
                }
              },
              duration: 2 // 持续2周
            }
          }
        )
      ],
      conditions: {
        probability: 0.3,
        minWeek: 3
      },
      repeatable: true,
      weight: 1
    }),
    
    // 多地区多商品价格变化事件
    createEvent({
      id: 'nationwide_paper_shortage',
      title: '全国性纸张短缺',
      description: '由于环保政策收紧和原料价格上涨，全国范围内出现纸张短缺现象。大宗商品交易所和二手市场的卫生纸价格飙升，而其他地区受影响较小。',
      type: EventType.MARKET,
      options: [
        createEventOption(
          '分析影响', 
          '你分析了这次纸张短缺对各个市场的影响，并调整了你的交易策略。',
          {
            market: {
              // 对特定地区的特定商品(ID:101卫生纸)涨价
              locationProductModifiers: {
                'commodity_market': {
                  '101': 1.7 // 大宗商品交易所的卫生纸涨价70%
                },
                'second_hand_market': {
                  '101': 1.5 // 二手市场的卫生纸涨价50%
                }
              },
              duration: 3 // 持续3周
            }
          }
        )
      ],
      conditions: {
        probability: 0.25,
        minWeek: 8
      },
      repeatable: true,
      weight: 2
    }),
    
    // 对比事件：地区繁荣与萧条
    createEvent({
      id: 'market_contrast_event',
      title: '城市区域发展不均',
      description: '最新城市规划调整导致电子科技城获得大量投资和客流，而地下黑市却因管控加强而客流锐减。这种发展不均衡引发了明显的市场差异。',
      type: EventType.MARKET,
      options: [
        createEventOption(
          '分析市场机会', 
          '你仔细分析了城市不同区域的发展变化，寻找其中的交易机会。',
          {
            market: {
              // 对比效应：一个地区繁荣（降价），另一个萧条（涨价）
              locationModifiers: {
                'electronics_hub': 0.8, // 电子科技城繁荣，整体降价20%
                'black_market': 1.4 // 地下黑市萧条，整体涨价40%
              },
              duration: 5 // 持续5周
            }
          }
        )
      ],
      conditions: {
        probability: 0.2,
        minWeek: 12
      },
      repeatable: true,
      weight: 2
    }),
    
    // 供应链中断事件
    createEvent({
      id: 'supply_chain_disruption',
      title: '全球供应链中断危机',
      description: '突发新闻：全球贸易遭遇严重供应链中断！各地区不同商品价格出现剧烈波动，部分商品短缺涨价，部分商品积压降价。此次危机预计将对市场产生深远影响。',
      type: EventType.MARKET,
      options: [
        createEventOption(
          '在大宗市场囤积基本物资', 
          '你预判到基本生活物资将会短缺，决定前往大宗商品交易所囤积必需品。',
          {
            market: {
              // 全局市场轻微波动
              globalPriceModifier: 1.05,
              // 大宗商品交易所的物资价格变化
              locationProductModifiers: {
                'commodity_market': {
                  '202': 1.6, // 大米价格上涨60%
                  '203': 1.5, // 食用油价格上涨50%
                  '101': 1.4  // 卫生纸价格上涨40%
                },
                'electronics_hub': {
                  '301': 0.7, // 手机降价30%（电子产品积压）
                  '305': 0.75 // 智能手表降价25%
                },
                'premium_mall': {
                  '404': 0.8 // 高级香水降价20%（奢侈品销售下滑）
                }
              },
              duration: 4 // 持续4周
            },
            forceLocationChange: true,
            targetLocation: 'commodity_market'
          }
        ),
        createEventOption(
          '投资受影响商品', 
          '你认为这是投资低价电子产品的好机会，决定前往电子科技城大量购入。',
          {
            market: {
              locationModifiers: {
                'electronics_hub': 0.85 // 电子科技城整体降价15%
              },
              locationProductModifiers: {
                'electronics_hub': {
                  '301': 0.6, // 手机降价40%
                  '305': 0.65 // 智能手表降价35%
                },
                'commodity_market': {
                  '202': 1.45, // 大米价格上涨45%
                  '203': 1.4  // 食用油价格上涨40%
                }
              },
              duration: 3 // 持续3周
            },
            forceLocationChange: true,
            targetLocation: 'electronics_hub'
          }
        ),
        createEventOption(
          '寻找黑市稀缺资源', 
          '你猜测某些特殊商品可能在黑市变得更加稀缺且价值上升，决定前往地下黑市探索机会。',
          {
            market: {
              locationModifiers: {
                'black_market': 1.2 // 黑市整体涨价20%
              },
              locationProductModifiers: {
                'black_market': {
                  '502': 1.8, // 邮票价格上涨80%（收藏品价值飙升）
                  '503': 1.9  // 古画价格上涨90%
                },
                'second_hand_market': {
                  '107': 0.7, // 二手物品降价30%（需求下降）
                  '106': 0.75 // 二手物品降价25%
                }
              },
              duration: 3 // 持续3周
            },
            forceLocationChange: true,
            targetLocation: 'black_market'
          }
        ),
        createEventOption(
          '保持观望', 
          '你决定暂时不介入这次混乱的市场波动，等待形势更加明朗。',
          {
            // 仅记录市场变化，但不采取行动
            market: {
              globalPriceModifier: 1.02,
              duration: 2 // 持续2周
            }
          }
        )
      ],
      conditions: {
        probability: 0.15, // 较低概率触发，因为是重大事件
        minWeek: 15        // 游戏进行到中后期才会触发
      },
      repeatable: false,   // 重大事件，不可重复触发
      weight: 3           // 较高权重，优先触发
    })
  );
  
  // 缓存创建的事件
  eventsCache = events;
  
  return events;
}

/**
 * 根据ID获取事件
 * @param {string} id 事件ID
 * @returns {Event|null} 事件实例或null
 */
export function getEventById(id) {
  const eventData = predefinedEvents.find(e => e.id === id);
  if (!eventData) return null;
  
  // 确保事件选项是EventOption实例
  const options = eventData.options.map(option => {
    if (!(option instanceof EventOption)) {
      return new EventOption(option);
    }
    return option;
  });
  
  // 创建Event实例并确保imageUrl属性被正确传递
  return new Event({
    ...eventData,
    options,
    imageUrl: eventData.imageUrl || (typeof eventData[8] === 'string' ? eventData[8] : null) // 确保第9个参数被作为imageUrl传递
  });
}