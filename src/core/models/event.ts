/**
 * 事件领域模型 - TypeScript版本
 * 管理游戏中的事件及其属性
 */

// ==================== 类型定义 ====================

/**
 * 事件类型枚举
 */
export enum EventType {
  RANDOM = 'random',       // 随机事件
  STORY = 'story',         // 故事/剧情事件
  LOCATION = 'location',   // 地点特定事件
  MARKET = 'market',       // 市场事件
  PERSONAL = 'personal',   // 个人事件
  TUTORIAL = 'tutorial'    // 教程事件
}

/**
 * 事件效果类型枚举
 */
export enum EffectType {
  MONEY = 'money',                    // 金钱变化
  DEBT = 'debt',                      // 债务变化
  INVENTORY = 'inventory',            // 物品变化
  MARKET = 'market',                  // 市场影响
  ATTRIBUTE = 'attribute',            // 属性变化
  LOCATION = 'location',              // 地点变化
  CAPACITY = 'capacity',              // 背包容量变化
  NEXT_EVENT = 'next_event',          // 触发下一个事件
  GAME_STATE = 'game_state'           // 游戏状态变化
}

// ==================== 接口定义 ====================

/**
 * 游戏状态接口
 */
export interface GameState {
  currentWeek: number;
  maxWeeks: number;
  player: PlayerState;
  market: MarketState;
  currentLocation: string;
  [key: string]: any;
}

/**
 * 玩家状态接口
 */
export interface PlayerState {
  money: number;
  debt: number;
  inventory: InventoryItem[];
  attributes?: Record<string, number>;
  purchasedHouses?: any[];
  [key: string]: any;
}

/**
 * 市场状态接口
 */
export interface MarketState {
  [key: string]: any;
}

/**
 * 背包物品接口
 */
export interface InventoryItem {
  productId: string;
  quantity: number;
  [key: string]: any;
}

/**
 * 金钱条件接口
 */
export interface MoneyCondition {
  min?: number;
  max?: number;
}

/**
 * 背包物品条件接口
 */
export interface InventoryItemCondition {
  productId: string;
  minQuantity?: number;
  maxQuantity?: number;
}

/**
 * 属性条件接口
 */
export interface AttributeCondition {
  min?: number;
  max?: number;
}

/**
 * 市场修改器接口
 */
export interface MarketModifier {
  locationModifiers?: Record<string, { modifier: number; duration: number }>;
  categoryModifier?: string;
  modifier?: number;
  duration?: number;
}

/**
 * 事件条件初始化选项接口
 */
export interface EventConditionsOptions {
  minWeek?: number | null;
  maxWeek?: number | null;
  locations?: string[] | null;
  probability?: number;
  playerMoney?: MoneyCondition | null;
  playerDebt?: MoneyCondition | null;
  inventoryItems?: InventoryItemCondition[] | null;
  attributes?: Record<string, AttributeCondition> | null;
  requiredEvents?: string[] | null;
  excludedEvents?: string[] | null;
  customCondition?: ((gameState: GameState) => boolean) | null;
}

/**
 * 事件效果初始化选项接口
 */
export interface EventEffectsOptions {
  money?: number;
  debt?: number;
  inventory?: InventoryItem[];
  market?: MarketModifier | null;
  attributes?: Record<string, number>;
  location?: string | null;
  capacity?: number;
  nextEvent?: string | null;
  gameState?: Record<string, any>;
}

/**
 * 事件选项初始化选项接口
 */
export interface EventOptionOptions {
  text: string;
  result: string;
  effects: EventEffects | EventEffectsOptions;
  condition?: ((gameState: GameState) => boolean) | null;
}

/**
 * 事件初始化选项接口
 */
export interface EventOptions {
  id: string;
  title: string;
  description: string;
  options: (EventOption | EventOptionOptions)[];
  conditions?: EventConditions | EventConditionsOptions | null;
  repeatable?: boolean;
  type?: EventType;
  weight?: number;
  imageUrl?: string | null;
}

// ==================== 类定义 ====================

/**
 * 事件效果类
 * 封装事件产生的各种效果
 */
export class EventEffects {
  money: number;
  debt: number;
  inventory: InventoryItem[];
  market: MarketModifier | null;
  attributes: Record<string, number>;
  location: string | null;
  capacity: number;
  nextEvent: string | null;
  gameState: Record<string, any>;

  /**
   * 创建事件效果实例
   * @param options 效果初始化选项
   */
  constructor({
    money = 0,
    debt = 0,
    inventory = [],
    market = null,
    attributes = {},
    location = null,
    capacity = 0,
    nextEvent = null,
    gameState = {}
  }: EventEffectsOptions = {}) {
    this.money = money;
    this.debt = debt;
    this.inventory = inventory;
    this.market = market;
    this.attributes = attributes;
    this.location = location;
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
  minWeek: number | null;
  maxWeek: number | null;
  locations: string[] | null;
  probability: number;
  playerMoney: MoneyCondition | null;
  playerDebt: MoneyCondition | null;
  inventoryItems: InventoryItemCondition[] | null;
  attributes: Record<string, AttributeCondition> | null;
  requiredEvents: string[] | null;
  excludedEvents: string[] | null;
  customCondition: ((gameState: GameState) => boolean) | null;

  /**
   * 创建事件条件实例
   * @param options 条件初始化配置
   */
  constructor({
    minWeek = null,
    maxWeek = null,
    locations = null,
    probability = 1,
    playerMoney = null,
    playerDebt = null,
    inventoryItems = null,
    attributes = null,
    requiredEvents = null,
    excludedEvents = null,
    customCondition = null
  }: EventConditionsOptions = {}) {
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

/**
 * 事件选项类
 * 封装事件选项的属性和行为
 */
export class EventOption {
  text: string;
  result: string;
  effects: EventEffects;
  condition: ((gameState: GameState) => boolean) | null;

  /**
   * 创建事件选项实例
   * @param options 选项初始化配置
   */
  constructor({
    text,
    result,
    effects,
    condition = null
  }: EventOptionOptions) {
    this.text = text;
    this.result = result;
    this.effects = effects instanceof EventEffects ? effects : new EventEffects(effects);
    this.condition = condition;
  }

  /**
   * 检查选项是否可用
   * @param gameState 游戏状态
   * @returns 选项是否可用
   */
  isAvailable(gameState: GameState): boolean {
    return this.condition === null || this.condition(gameState);
  }
}

/**
 * 事件类
 * 封装事件的属性和行为
 */
export class Event {
  id: string;
  title: string;
  description: string;
  options: EventOption[];
  conditions: EventConditions;
  repeatable: boolean;
  type: EventType;
  weight: number;
  imageUrl: string | null;

  /**
   * 创建事件实例
   * @param options 事件初始化选项
   */
  constructor({
    id,
    title,
    description,
    options,
    conditions = null,
    repeatable = false,
    type = EventType.RANDOM,
    weight = 1,
    imageUrl = null
  }: EventOptions) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.options = options.map(option =>
      option instanceof EventOption ? option : new EventOption(option)
    );
    this.conditions = conditions instanceof EventConditions
      ? conditions
      : new EventConditions(conditions || {});
    this.repeatable = repeatable;
    this.type = type;
    this.weight = weight;
    this.imageUrl = imageUrl;
  }

  /**
   * 检查事件是否满足触发条件
   * @param gameState 游戏状态
   * @param triggeredEvents 已触发事件列表
   * @returns 是否满足触发条件
   */
  canTrigger(gameState: GameState, triggeredEvents: string[] = []): boolean {
    const c = this.conditions;

    // 检查可重复性
    if (!this.repeatable && triggeredEvents.includes(this.id)) {
      return false;
    }

    // 检查周数限制
    if (c.minWeek !== null && gameState.currentWeek < c.minWeek) return false;
    if (c.maxWeek !== null && gameState.currentWeek > c.maxWeek) return false;

    // 检查地点限制
    if (c.locations !== null && !c.locations.includes(gameState.currentLocation)) {
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
   * @param gameState 游戏状态
   * @returns 可用的事件选项
   */
  getAvailableOptions(gameState: GameState): EventOption[] {
    return this.options.filter(option => {
      return option.condition === null || option.condition(gameState);
    });
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建事件工厂函数 - TypeScript版本
 * @param options 事件初始化选项或兼容旧版API的参数
 * @returns 新的事件实例
 */
export function createEvent(
  options: EventOptions
): Event;
export function createEvent(
  id: string,
  title: string,
  description: string,
  options: (EventOption | EventOptionOptions)[],
  conditions?: EventConditions | EventConditionsOptions | null,
  repeatable?: boolean,
  type?: EventType,
  weight?: number,
  imageUrl?: string | null
): Event;
export function createEvent(
  optionsOrId: EventOptions | string,
  title?: string,
  description?: string,
  options?: (EventOption | EventOptionOptions)[],
  conditions?: EventConditions | EventConditionsOptions | null,
  repeatable?: boolean,
  type?: EventType,
  weight?: number,
  imageUrl?: string | null
): Event {
  if (typeof optionsOrId === 'object') {
    return new Event(optionsOrId);
  } else {
    // 兼容旧版API
    return new Event({
      id: optionsOrId,
      title: title!,
      description: description!,
      options: options!,
      conditions,
      repeatable,
      type,
      weight,
      imageUrl
    });
  }
}

/**
 * 创建事件选项工厂函数 - TypeScript版本
 * @param text 选项文本
 * @param result 结果文本
 * @param effects 效果对象
 * @param condition 选项显示条件
 * @returns 事件选项对象
 */
export const createEventOption = (
  text: string,
  result: string,
  effects: EventEffects | EventEffectsOptions,
  condition: ((gameState: GameState) => boolean) | null = null
): EventOption => {
  return new EventOption({ text, result, effects, condition });
};

/**
 * 创建事件效果对象 - TypeScript版本
 * @param options 效果选项
 * @returns 事件效果对象
 */
export const createEventEffects = (options: EventEffectsOptions = {}): EventEffects => {
  return new EventEffects(options);
};

/**
 * 创建事件触发条件 - TypeScript版本
 * @param options 条件选项
 * @returns 事件触发条件对象
 */
export const createEventConditions = (options: EventConditionsOptions = {}): EventConditions => {
  return new EventConditions(options);
};

// ==================== 预定义事件数据 ====================

/**
 * 预定义事件列表
 */
const predefinedEvents: Event[] = [
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
              'premium_mall': { modifier: 1.25, duration: 2 }, // 高端商城价格上涨25%
              'electronics_hub': { modifier: 1.15, duration: 2 } // 电子科技城价格上涨15%
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
              'premium_mall': { modifier: 1.2, duration: 1 }, // 高端商城价格上涨20%
              'electronics_hub': { modifier: 1.1, duration: 1 } // 电子科技城价格上涨10%
            },
            duration: 1 // 持续1周
          }
        }),
        (gameState: GameState) => (gameState.player.inventory?.length || 0) > 0 // 只有当背包中有物品时才显示此选项
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
              'second_hand_market': { modifier: 0.65, duration: 3 }, // 二手市场价格下跌35%
              'black_market': { modifier: 0.7, duration: 3 } // 地下黑市价格下跌30%
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
              'second_hand_market': { modifier: 0.75, duration: 1 }, // 二手市场价格下跌25%
              'black_market': { modifier: 0.8, duration: 1 } // 地下黑市价格下跌20%
            },
            duration: 1 // 持续1周
          }
        }),
        (gameState: GameState) => (gameState.player.inventory?.length || 0) > 0
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
          location: 'commodity_market'
        })
      ),
      createEventOption(
        '冒险完成交易',
        '你冒险留下来完成交易，获得了低价商品，但差点被执法人员抓住。',
        createEventEffects({
          money: -2000, // 花费2000元购买低价商品
          inventory: [
            { productId: 'stamp_502', quantity: 1 }, // 邮票，低于市场价
            { productId: 'coin_505', quantity: 2 }   // 纪念币，低于市场价
          ],
          attributes: { businessSkill: 1, riskTolerance: 1 }
        }),
        (gameState: GameState) => gameState.player.money >= 2000 && // 确保玩家有足够的钱
                       (gameState.player.inventory?.length || 0) <= 47 // 确保有足够的背包空间（假设容量50）
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
  )
];

// ==================== 导出函数 ====================

/**
 * 根据ID获取事件
 * @param id 事件ID
 * @returns 事件实例或null
 */
export function getEventById(id: string): Event | null {
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
    imageUrl: eventData.imageUrl
  });
}

/**
 * 获取所有预定义事件
 * @returns 所有预定义事件数组
 */
export function getAllEvents(): Event[] {
  return predefinedEvents.map(event => getEventById(event.id)!);
}

/**
 * 根据类型获取事件
 * @param type 事件类型
 * @returns 匹配类型的事件数组
 */
export function getEventsByType(type: EventType): Event[] {
  return predefinedEvents.filter(event => event.type === type);
}

/**
 * 根据条件过滤可触发的事件
 * @param gameState 游戏状态
 * @param triggeredEvents 已触发事件列表
 * @returns 可触发的事件数组
 */
export function getAvailableEvents(gameState: GameState, triggeredEvents: string[] = []): Event[] {
  return predefinedEvents.filter(event => event.canTrigger(gameState, triggeredEvents));
}
