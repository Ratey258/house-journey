/**
 * 游戏配置文件
 * 包含游戏核心参数、玩家设置、市场配置等
 */

/**
 * 玩家配置接口
 */
export interface PlayerConfig {
  initialMoney: number;
  initialDebt: number;
  initialLoanPrincipal: number;
  initialCapacity: number;
  maxLoanAmount: number;
  depositInterestRate: number; // 存款利息率
  loanInterestRate: number;    // 贷款利息率
}

/**
 * 市场配置接口
 */
export interface MarketConfig {
  maxWeeks: number;
  endlessThreshold: number;
  priceChangeMaxRatio: number;
  trendInfluenceEarly: number;
  trendInfluenceLate: number;
  trendSwitchWeek: number;
}

/**
 * 事件配置接口
 */
export interface EventConfig {
  eventDuration: number;
  eventCooldown: number;
  randomEventChance: number;
}

/**
 * 游戏配置接口
 */
export interface GameConfig {
  player: PlayerConfig;
  market: MarketConfig;
  events: EventConfig;
  scoring: {
    rankThresholds: {
      S: number;
      A: number;
      B: number;
      C: number;
      D: number;
    };
    wealthFactorMax: number;
    wealthFactorDivisor: number;
    cashFactorMax: number;  
    cashFactorDivisor: number;
  };
}

/**
 * 游戏配置
 */
export const gameConfig: GameConfig = {
  // 玩家相关配置
  player: {
    initialMoney: 2000,           // 初始资金
    initialDebt: 5000,            // 初始债务
    initialLoanPrincipal: 5000,   // 初始贷款本金
    initialCapacity: 100,         // 初始背包容量
    maxLoanAmount: 20000,         // 最大贷款额度
    depositInterestRate: 0.003,   // 存款利息率 0.3%/周
    loanInterestRate: 0.005       // 贷款利息率 0.5%/周
  },

  // 市场相关配置  
  market: {
    maxWeeks: 52,                 // 默认最大周数
    endlessThreshold: 1000,       // 无尽模式阈值
    priceChangeMaxRatio: 0.3,     // 价格最大变化比例
    trendInfluenceEarly: 0.005,   // 早期趋势影响
    trendInfluenceLate: -0.005,   // 后期趋势影响
    trendSwitchWeek: 26           // 趋势转换周次
  },

  // 事件相关配置
  events: {
    eventDuration: 3000,          // 事件显示持续时间 (ms)
    eventCooldown: 5000,          // 事件冷却时间 (ms)
    randomEventChance: 0.2        // 随机事件触发概率
  },

  // 评分相关配置
  scoring: {
    rankThresholds: {
      S: 1000000,   // S级门槛
      A: 800000,    // A级门槛  
      B: 600000,    // B级门槛
      C: 400000,    // C级门槛
      D: 200000     // D级门槛
    },
    wealthFactorMax: 50,          // 财富因子最大贡献
    wealthFactorDivisor: 10000,   // 财富因子除数
    cashFactorMax: 10,            // 现金因子最大贡献
    cashFactorDivisor: 20000      // 现金因子除数
  }
};

/**
 * 获取玩家配置
 */
export const getPlayerConfig = (): PlayerConfig => gameConfig.player;

/**
 * 获取市场配置
 */
export const getMarketConfig = (): MarketConfig => gameConfig.market;

/**
 * 获取事件配置
 */
export const getEventConfig = (): EventConfig => gameConfig.events;

/**
 * 获取评分配置
 */
export const getScoringConfig = () => gameConfig.scoring;