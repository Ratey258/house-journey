/**
 * 游戏配置服务 - TypeScript版本
 * 提供统一的游戏平衡性参数管理
 */

import { type Player, type House, type HouseId, type InventoryItem } from '../models';

// ==================== 类型定义 ====================

/**
 * 游戏难度级别
 */
export enum DifficultyLevel {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard'
}

/**
 * 玩家配置接口
 */
export interface PlayerConfig {
  initialMoney: number;
  initialDebt: number;
  initialCapacity: number;
  debtInterestRate: number;
  debtGracePeriod: number;
}

/**
 * 市场配置接口
 */
export interface MarketConfig {
  priceTrendStrength: number;
  priceVolatility: number;
  specialProductDiscount: number;
  trendContinuationChance: number;
}

/**
 * 事件配置接口
 */
export interface EventConfig {
  positiveEventChance: number;
  eventFrequency: number;
  earlyGameEventMultiplier: number;
  lateGameEventMultiplier: number;
}

/**
 * 房屋配置接口
 */
export interface HouseConfig {
  housePriceMultipliers: Record<HouseId, number>;
}

/**
 * 游戏目标配置接口
 */
export interface GameGoalsConfig {
  requiredNetWorth: number;
  targetWeeks: number;
  debtRatio: number;
}

/**
 * 完整游戏配置接口
 */
export interface GameConfig {
  player: PlayerConfig;
  market: MarketConfig;
  events: EventConfig;
  houses: HouseConfig;
  gameGoals: GameGoalsConfig;
}

/**
 * 游戏阶段信息接口
 */
export interface GamePhaseInfo {
  phase: 'early' | 'early_mid' | 'mid' | 'mid_late' | 'late';
  eventMultiplier: number;
  priceVolatilityMultiplier: number;
}

/**
 * 事件概率调整接口
 */
export interface EventProbabilityAdjustments {
  frequency: number;
  positiveChance: number;
}

// ==================== 游戏配置数据 ====================

/**
 * 游戏配置参数表
 */
const gameConfigs: Record<DifficultyLevel, GameConfig> = {
  // 简单模式
  [DifficultyLevel.EASY]: {
    player: {
      initialMoney: 8000,
      initialDebt: 1000,
      initialCapacity: 150,
      debtInterestRate: 0.004, // 0.4%/周
      debtGracePeriod: 4      // 4周宽限期
    },
    market: {
      priceTrendStrength: 0.8,  // 价格趋势强度降低
      priceVolatility: 0.8,     // 价格波动幅度降低
      specialProductDiscount: 0.25, // 特产折扣25%
      trendContinuationChance: 0.8  // 趋势延续概率更高
    },
    events: {
      positiveEventChance: 0.7, // 正面事件概率更高
      eventFrequency: 0.3,      // 事件触发频率较低
      earlyGameEventMultiplier: 0.7, // 游戏前期事件更少
      lateGameEventMultiplier: 1.1   // 游戏后期事件略多
    },
    houses: {
      // 房屋价格调整
      housePriceMultipliers: {
        'apartment': 0.9,
        'house': 0.9,
        'villa': 0.85,
        'mansion': 0.85
      }
    },
    gameGoals: {
      requiredNetWorth: 350000,
      targetWeeks: 52,         // 游戏时长不变
      debtRatio: 0.5          // 债务比例更宽松
    }
  },
  
  // 普通模式
  [DifficultyLevel.NORMAL]: {
    player: {
      initialMoney: 5000,
      initialDebt: 2000,
      initialCapacity: 100,
      debtInterestRate: 0.005, // 0.5%/周
      debtGracePeriod: 3      // 3周宽限期
    },
    market: {
      priceTrendStrength: 1.0,  // 标准价格趋势强度
      priceVolatility: 1.0,     // 标准价格波动幅度
      specialProductDiscount: 0.15, // 特产折扣15%
      trendContinuationChance: 0.75 // 标准趋势延续概率
    },
    events: {
      positiveEventChance: 0.5, // 正负面事件平衡
      eventFrequency: 0.4,      // 标准事件触发频率
      earlyGameEventMultiplier: 0.8, // 游戏前期事件较少
      lateGameEventMultiplier: 1.2   // 游戏后期事件较多
    },
    houses: {
      housePriceMultipliers: {
        'apartment': 1.0,
        'house': 1.0,
        'villa': 1.0,
        'mansion': 1.0
      }
    },
    gameGoals: {
      requiredNetWorth: 400000,
      targetWeeks: 52,
      debtRatio: 0.4
    }
  },
  
  // 困难模式
  [DifficultyLevel.HARD]: {
    player: {
      initialMoney: 3500,
      initialDebt: 3000,
      initialCapacity: 80,
      debtInterestRate: 0.006, // 0.6%/周
      debtGracePeriod: 2      // 2周宽限期
    },
    market: {
      priceTrendStrength: 1.2,  // 价格趋势更明显
      priceVolatility: 1.3,     // 价格波动更剧烈
      specialProductDiscount: 0.1, // 特产折扣仅10%
      trendContinuationChance: 0.7 // 趋势延续概率较低，更多变化
    },
    events: {
      positiveEventChance: 0.4, // 负面事件更多
      eventFrequency: 0.5,      // 事件触发更频繁
      earlyGameEventMultiplier: 0.9, // 游戏前期事件稍少
      lateGameEventMultiplier: 1.3   // 游戏后期事件明显增多
    },
    houses: {
      housePriceMultipliers: {
        'apartment': 1.1,
        'house': 1.15,
        'villa': 1.2,
        'mansion': 1.25
      }
    },
    gameGoals: {
      requiredNetWorth: 450000,
      targetWeeks: 52,
      debtRatio: 0.35        // 债务比例更严格
    }
  }
};

// ==================== 导出函数 ====================

/**
 * 获取当前游戏配置
 * @param difficulty 难度级别
 * @returns 游戏配置
 */
export function getGameConfig(difficulty: DifficultyLevel = DifficultyLevel.NORMAL): GameConfig {
  return gameConfigs[difficulty] || gameConfigs[DifficultyLevel.NORMAL];
}

/**
 * 获取游戏阶段系数
 * 根据当前游戏进度返回不同阶段的调整系数
 * @param currentWeek 当前周数
 * @param maxWeeks 最大周数
 * @returns 游戏阶段系数
 */
export function getGamePhaseMultipliers(currentWeek: number, maxWeeks: number = 52): GamePhaseInfo {
  const progress = currentWeek / maxWeeks;
  
  // 游戏阶段划分
  if (progress < 0.2) {
    return { phase: 'early', eventMultiplier: 0.8, priceVolatilityMultiplier: 0.9 };
  } else if (progress < 0.4) {
    return { phase: 'early_mid', eventMultiplier: 0.9, priceVolatilityMultiplier: 1.0 };
  } else if (progress < 0.6) {
    return { phase: 'mid', eventMultiplier: 1.0, priceVolatilityMultiplier: 1.0 };
  } else if (progress < 0.8) {
    return { phase: 'mid_late', eventMultiplier: 1.1, priceVolatilityMultiplier: 1.1 };
  } else {
    return { phase: 'late', eventMultiplier: 1.2, priceVolatilityMultiplier: 1.2 };
  }
}

/**
 * 计算适合玩家状态的房屋价格调整
 * 当玩家资产接近房屋价格时提供微调，防止长期无法达成目标
 * @param player 玩家对象
 * @param houses 房屋列表
 * @param currentWeek 当前周数
 * @param maxWeeks 最大周数
 * @returns 房屋价格调整系数
 */
export function calculateHousePriceAdjustment(
  player: Player, 
  houses: House[], 
  currentWeek: number, 
  maxWeeks: number = 52
): Record<HouseId, number> {
  // 游戏后半程才启用动态调整
  if (currentWeek < maxWeeks * 0.5) return {};
  
  // 计算玩家资产
  const netWorth = player.money + player.inventory.reduce((sum: number, item: InventoryItem) => {
    return sum + (item.quantity * item.averagePrice);
  }, 0) - player.debt;
  
  // 计算距离最高级别房屋的差距比例
  const highestHouse = houses.sort((a, b) => b.price - a.price)[0];
  if (!highestHouse) return {};
  
  const priceDifference = highestHouse.price - netWorth;
  const diffRatio = priceDifference / highestHouse.price;
  
  // 如果玩家资产长期低于目标，提供小幅价格调整
  if (diffRatio > 0.3 && currentWeek > maxWeeks * 0.7) {
    // 越接近游戏结束，调整越明显
    const endGameFactor = (currentWeek / maxWeeks - 0.7) / 0.3;
    const adjustmentFactor = 0.95 + (endGameFactor * 0.05);
    
    return { [highestHouse.id]: adjustmentFactor };
  }
  
  return {};
}

/**
 * 计算债务利率调整
 * 防止债务陷阱和滚雪球效应
 * @param player 玩家对象
 * @param config 游戏配置
 * @param currentWeek 当前周数
 * @returns 调整后的债务利率
 */
export function calculateDebtInterestAdjustment(
  player: Player, 
  config: GameConfig, 
  currentWeek: number
): number {
  const baseRate = config.player.debtInterestRate;
  
  // 如果玩家债务过高，提供利率减免
  const debtToMoneyRatio = player.debt / Math.max(player.money, 1);
  
  if (debtToMoneyRatio > 5) {
    return baseRate * 0.8; // 严重债务，降低利率
  } else if (debtToMoneyRatio > 3) {
    return baseRate * 0.9; // 较高债务，小幅降低利率
  }
  
  return baseRate; // 正常利率
}

/**
 * 获取事件概率调整
 * 根据游戏进度和玩家状态调整事件触发概率
 * @param player 玩家对象
 * @param config 游戏配置
 * @param currentWeek 当前周数
 * @param maxWeeks 最大周数
 * @returns 事件概率调整
 */
export function getEventProbabilityAdjustments(
  player: Player, 
  config: GameConfig, 
  currentWeek: number, 
  maxWeeks: number = 52
): EventProbabilityAdjustments {
  const { phase, eventMultiplier } = getGamePhaseMultipliers(currentWeek, maxWeeks);
  
  // 基础事件频率
  let frequencyMultiplier = eventMultiplier;
  
  // 根据玩家财务状况调整
  const netWorth = player.money - player.debt;
  if (netWorth < 0) {
    // 负资产玩家，增加正面事件概率
    return {
      frequency: config.events.eventFrequency * frequencyMultiplier,
      positiveChance: Math.min(config.events.positiveEventChance * 1.2, 0.9)
    };
  } else if (netWorth > 200000) {
    // 富有玩家，增加负面事件概率
    return {
      frequency: config.events.eventFrequency * frequencyMultiplier,
      positiveChance: Math.max(config.events.positiveEventChance * 0.8, 0.3)
    };
  }
  
  // 默认调整
  return {
    frequency: config.events.eventFrequency * frequencyMultiplier,
    positiveChance: config.events.positiveEventChance
  };
}

// ==================== 兼容导出 ====================

/**
 * @deprecated 使用 DifficultyLevel 枚举替代
 */
export const DifficultyLevelLegacy = {
  EASY: 'easy' as const,
  NORMAL: 'normal' as const,
  HARD: 'hard' as const
};