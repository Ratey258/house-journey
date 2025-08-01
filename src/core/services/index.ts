/**
 * services 模块索引文件 - TypeScript版本
 * 
 * 该文件导出 core/services 目录下的所有模块
 */

// ==================== 价格系统 ====================
export * from './priceSystem';

// ==================== 事件系统 ====================
export * from './eventSystem';

// ==================== 游戏循环服务 ====================
export * from './gameLoopService';

// ==================== 游戏配置服务 ====================
export * from './gameConfigService';

// ==================== 类型导出 ====================

// 导出核心游戏类型
export type {
  GameState,
  GameDifficulty,
  TradeResult,
  HousePurchaseResult,
  SaveState
} from './gameLoopService';

// 导出配置类型
export type {
  DifficultyLevel,
  GameConfig,
  PlayerConfig,
  MarketConfig,
  EventConfig,
  HouseConfig,
  GameGoalsConfig,
  GamePhaseInfo,
  EventProbabilityAdjustments
} from './gameConfigService';

// 导出事件系统类型
export type {
  GameEventType,
  EventEffectType,
  EventStage
} from './eventSystem';

// ==================== 兼容性导出 ====================

/**
 * @deprecated priceService已废弃，请使用priceSystem替代
 * 如果您看到此错误，说明您的代码仍在使用已废弃的 priceService
 * 请将所有导入从 'priceService' 更改为 'priceSystem'，并使用函数式API
 */
export default function deprecatedPriceService(): never {
  throw new Error('priceService已废弃，请使用priceSystem替代。');
}