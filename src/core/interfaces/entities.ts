/**
 * 核心业务实体接口定义
 * 定义领域模型的完整类型体系
 */

// ==================== 基础实体接口 ====================

/**
 * 基础实体接口
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

/**
 * 可软删除实体接口
 */
export interface SoftDeletableEntity extends BaseEntity {
  deletedAt?: Date;
  isDeleted: boolean;
}

/**
 * 可审计实体接口
 */
export interface AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
}

// ==================== 玩家实体接口 ====================

/**
 * 玩家统计信息接口
 */
export interface PlayerStatistics {
  /** 交易总次数 */
  transactionCount: number;
  /** 总利润 */
  totalProfit: number;
  /** 平均利润 */
  averageProfit: number;
  /** 最佳单笔交易利润 */
  bestDeal: number;
  /** 最差单笔交易利润 */
  worstDeal: number;
  /** 总收入 */
  totalRevenue: number;
  /** 总支出 */
  totalExpenses: number;
  /** 成功交易次数 */
  successfulTrades: number;
  /** 失败交易次数 */
  failedTrades: number;
  /** 访问过的地点数 */
  locationsVisited: number;
  /** 购买过的商品种类数 */
  productsTraded: number;
  /** 总游戏时长（分钟） */
  totalPlayTime: number;
  /** 最高资金记录 */
  highestMoney: number;
  /** 最高债务记录 */
  highestDebt: number;
}

/**
 * 玩家配置接口
 */
export interface PlayerSettings {
  /** 语言设置 */
  language: 'zh-CN' | 'en-US';
  /** 主题设置 */
  theme: 'light' | 'dark' | 'auto';
  /** 音效开关 */
  soundEnabled: boolean;
  /** 音乐开关 */
  musicEnabled: boolean;
  /** 自动保存开关 */
  autoSaveEnabled: boolean;
  /** 自动保存间隔（分钟） */
  autoSaveInterval: number;
  /** 显示教程提示 */
  showTutorialTips: boolean;
  /** 快捷键设置 */
  keyboardShortcuts: Record<string, string>;
}

/**
 * 玩家成就接口
 */
export interface PlayerAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'trading' | 'exploration' | 'wealth' | 'time' | 'special';
  unlockedAt?: Date;
  progress?: number; // 0-100
  isHidden?: boolean;
  reward?: AchievementReward;
}

/**
 * 成就奖励接口
 */
export interface AchievementReward {
  type: 'money' | 'capacity' | 'title' | 'feature';
  value: number;
  description: string;
}

/**
 * 玩家实体接口
 */
export interface Player extends AuditableEntity {
  /** 玩家姓名 */
  name: string;
  /** 当前资金 */
  money: number;
  /** 当前债务 */
  debt: number;
  /** 银行存款 */
  bankDeposit: number;
  /** 可贷款额度 */
  availableLoanAmount: number;
  /** 背包容量 */
  capacity: number;
  /** 已使用背包空间 */
  inventoryUsed: number;
  /** 当前所在地点 */
  currentLocation: string;
  /** 库存物品 */
  inventory: InventoryItem[];
  /** 玩家统计 */
  statistics: PlayerStatistics;
  /** 玩家设置 */
  settings: PlayerSettings;
  /** 玩家成就 */
  achievements: PlayerAchievement[];
  /** 访问过的地点历史 */
  locationHistory: LocationVisit[];
  /** 交易历史 */
  tradeHistory: TradeRecord[];
  /** 游戏开始时间 */
  gameStartedAt: Date;
  /** 最后活跃时间 */
  lastActiveAt: Date;
  /** 玩家等级 */
  level: number;
  /** 经验值 */
  experience: number;
  /** 声誉值 */
  reputation: number;
}

// ==================== 库存相关接口 ====================

/**
 * 库存物品接口
 */
export interface InventoryItem {
  /** 物品ID */
  id: string;
  /** 产品ID */
  productId: string;
  /** 产品名称 */
  productName: string;
  /** 数量 */
  quantity: number;
  /** 购买价格 */
  purchasePrice: number;
  /** 购买时间 */
  purchaseDate: Date;
  /** 购买地点 */
  purchaseLocation: string;
  /** 物品品质 */
  quality: 'poor' | 'common' | 'rare' | 'epic' | 'legendary';
  /** 物品状态 */
  condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  /** 到期时间（可选） */
  expiryDate?: Date;
  /** 特殊属性 */
  attributes?: Record<string, any>;
}

/**
 * 地点访问记录接口
 */
export interface LocationVisit {
  locationId: string;
  locationName: string;
  visitedAt: Date;
  visitCount: number;
  firstVisitAt: Date;
  lastVisitAt: Date;
  totalTimeSpent: number; // 分钟
}

/**
 * 交易记录接口
 */
export interface TradeRecord {
  id: string;
  type: 'buy' | 'sell';
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  profit?: number; // 仅适用于销售
  location: string;
  tradedAt: Date;
  weekNumber: number;
  marketConditions?: MarketConditions;
}

// ==================== 产品实体接口 ====================

/**
 * 产品类别接口
 */
export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
}

/**
 * 产品属性接口
 */
export interface ProductAttribute {
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
}

/**
 * 产品实体接口
 */
export interface Product extends BaseEntity {
  /** 产品名称 */
  name: string;
  /** 产品描述 */
  description: string;
  /** 产品类别ID */
  categoryId: string;
  /** 产品类别 */
  category: ProductCategory;
  /** 基础价格 */
  basePrice: number;
  /** 最小价格 */
  minPrice: number;
  /** 最大价格 */
  maxPrice: number;
  /** 价格波动系数 */
  volatility: number;
  /** 市场需求度 */
  demand: number;
  /** 供应量 */
  supply: number;
  /** 单位重量/体积 */
  size: number;
  /** 产品图标 */
  icon: string;
  /** 产品图片 */
  image?: string;
  /** 产品等级 */
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  /** 产品标签 */
  tags: string[];
  /** 产品属性 */
  attributes: ProductAttribute[];
  /** 可交易地点 */
  availableLocations: string[];
  /** 季节性因子 */
  seasonalFactors?: SeasonalFactor[];
  /** 是否特殊商品 */
  isSpecial: boolean;
  /** 是否限时商品 */
  isLimitedTime: boolean;
  /** 限时开始时间 */
  limitedTimeStart?: Date;
  /** 限时结束时间 */
  limitedTimeEnd?: Date;
}

/**
 * 季节性因子接口
 */
export interface SeasonalFactor {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  multiplier: number;
  description: string;
}

// ==================== 地点实体接口 ====================

/**
 * 地点特性接口
 */
export interface LocationFeature {
  name: string;
  description: string;
  effect: LocationEffect;
}

/**
 * 地点效果接口
 */
export interface LocationEffect {
  type: 'price_multiplier' | 'demand_boost' | 'supply_boost' | 'special_products' | 'discount';
  value: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
}

/**
 * 地点实体接口
 */
export interface Location extends BaseEntity {
  /** 地点名称 */
  name: string;
  /** 地点描述 */
  description: string;
  /** 地点类型 */
  type: 'market' | 'mall' | 'warehouse' | 'factory' | 'port' | 'airport' | 'station';
  /** 地点等级 */
  tier: number;
  /** 价格修正因子 */
  priceModifier: number;
  /** 地点特性 */
  features: LocationFeature[];
  /** 可用产品类别 */
  availableCategories: string[];
  /** 特殊产品 */
  specialProducts: string[];
  /** 地点坐标 */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  /** 营业时间 */
  businessHours?: {
    open: string;
    close: string;
    timezone: string;
  };
  /** 交通成本 */
  travelCost: number;
  /** 解锁条件 */
  unlockConditions?: UnlockCondition[];
  /** 是否已解锁 */
  isUnlocked: boolean;
}

/**
 * 解锁条件接口
 */
export interface UnlockCondition {
  type: 'level' | 'money' | 'achievement' | 'week' | 'trade_count';
  value: any;
  description: string;
}

// ==================== 市场相关接口 ====================

/**
 * 价格信息接口
 */
export interface PriceInfo {
  /** 当前价格 */
  price: number;
  /** 价格趋势 */
  trend: 'rising' | 'falling' | 'stable' | 'volatile';
  /** 变化百分比 */
  changePercent: number;
  /** 置信度 */
  confidence: number;
  /** 最后更新时间 */
  lastUpdated: Date;
  /** 价格有效期 */
  validUntil?: Date;
  /** 历史最高价 */
  historicalHigh?: number;
  /** 历史最低价 */
  historicalLow?: number;
}

/**
 * 价格历史记录接口
 */
export interface PriceHistory {
  productId: string;
  locationId: string;
  weekNumber: number;
  price: number;
  trend: string;
  changePercent: number;
  volume: number; // 交易量
  recordedAt: Date;
}

/**
 * 市场条件接口
 */
export interface MarketConditions {
  /** 整体市场情绪 */
  sentiment: 'bullish' | 'bearish' | 'neutral';
  /** 通胀率 */
  inflationRate: number;
  /** 经济增长率 */
  economicGrowthRate: number;
  /** 消费者信心指数 */
  consumerConfidenceIndex: number;
  /** 供应链状况 */
  supplyChainStatus: 'normal' | 'disrupted' | 'critical';
  /** 季节 */
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  /** 特殊事件影响 */
  specialEvents: SpecialEvent[];
}

/**
 * 特殊事件接口
 */
export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  type: 'economic' | 'natural' | 'political' | 'technological' | 'social';
  impact: EventImpact;
  startWeek: number;
  endWeek: number;
  affectedProducts?: string[];
  affectedLocations?: string[];
}

/**
 * 事件影响接口
 */
export interface EventImpact {
  priceMultiplier: number;
  demandMultiplier: number;
  supplyMultiplier: number;
  volatilityMultiplier: number;
}

/**
 * 市场状态接口
 */
export interface MarketState extends BaseEntity {
  /** 当前周数 */
  currentWeek: number;
  /** 当前地点 */
  currentLocation: string;
  /** 所有产品价格 */
  productPrices: Record<string, PriceInfo>;
  /** 可用地点 */
  availableLocations: Location[];
  /** 当前市场条件 */
  marketConditions: MarketConditions;
  /** 价格历史 */
  priceHistory: PriceHistory[];
  /** 市场事件 */
  activeEvents: SpecialEvent[];
  /** 下次价格更新时间 */
  nextPriceUpdate: Date;
}

// ==================== 游戏相关接口 ====================

/**
 * 游戏配置接口
 */
export interface GameConfig {
  /** 最大周数 */
  maxWeeks: number;
  /** 起始资金 */
  startingMoney: number;
  /** 起始债务 */
  startingDebt: number;
  /** 起始地点 */
  startingLocation: string;
  /** 起始背包容量 */
  startingCapacity: number;
  /** 价格更新频率 */
  priceUpdateFrequency: number;
  /** 事件触发概率 */
  eventTriggerProbability: number;
  /** 难度等级 */
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  /** 是否无尽模式 */
  endlessMode: boolean;
  /** 自动保存间隔 */
  autoSaveInterval: number;
}

/**
 * 游戏状态接口
 */
export interface GameState extends BaseEntity {
  /** 游戏配置 */
  config: GameConfig;
  /** 当前玩家 */
  player: Player;
  /** 市场状态 */
  market: MarketState;
  /** 游戏阶段 */
  phase: 'loading' | 'playing' | 'paused' | 'ended' | 'victory' | 'defeat';
  /** 是否已开始 */
  isStarted: boolean;
  /** 是否已结束 */
  isEnded: boolean;
  /** 结束原因 */
  endReason?: 'victory' | 'defeat' | 'timeout' | 'quit' | 'bankruptcy';
  /** 游戏分数 */
  score?: number;
  /** 游戏等级 */
  grade?: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  /** 存档名称 */
  saveName?: string;
  /** 最后保存时间 */
  lastSavedAt?: Date;
}

// ==================== 存档相关接口 ====================

/**
 * 存档元数据接口
 */
export interface SaveMetadata {
  id: string;
  name: string;
  description?: string;
  playerName: string;
  currentWeek: number;
  playerMoney: number;
  difficulty: string;
  gameMode: string;
  createdAt: Date;
  updatedAt: Date;
  fileSize: number;
  version: string;
  checksum: string;
}

/**
 * 存档数据接口
 */
export interface SaveData {
  metadata: SaveMetadata;
  gameState: GameState;
  playerProgress: PlayerProgress;
  gameSettings: GameSettings;
}

/**
 * 玩家进度接口
 */
export interface PlayerProgress {
  unlockedLocations: string[];
  unlockedAchievements: string[];
  completedTutorials: string[];
  highScores: HighScore[];
  totalPlayTime: number;
  gamesPlayed: number;
  gamesWon: number;
}

/**
 * 高分记录接口
 */
export interface HighScore {
  score: number;
  playerName: string;
  difficulty: string;
  endWeek: number;
  finalMoney: number;
  achievedAt: Date;
}

/**
 * 游戏设置接口
 */
export interface GameSettings {
  graphics: GraphicsSettings;
  audio: AudioSettings;
  gameplay: GameplaySettings;
  accessibility: AccessibilitySettings;
}

/**
 * 图形设置接口
 */
export interface GraphicsSettings {
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
  particleEffects: boolean;
  quality: 'low' | 'medium' | 'high';
  colorBlindSupport: boolean;
}

/**
 * 音频设置接口
 */
export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  soundEffectsVolume: number;
  voiceVolume: number;
  muteOnBackground: boolean;
}

/**
 * 游戏玩法设置接口
 */
export interface GameplaySettings {
  autoSave: boolean;
  autoSaveInterval: number;
  showTutorials: boolean;
  confirmDangerousActions: boolean;
  fastAnimations: boolean;
  keyboardShortcuts: boolean;
}

/**
 * 无障碍设置接口
 */
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  colorBlindFriendly: boolean;
  keyboardNavigation: boolean;
}