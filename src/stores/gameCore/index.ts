/**
 * 游戏核心状态模块 - TypeScript版本
 * 导出游戏核心状态管理功能
 *
 * 🎯 P6阶段升级:
 * - TypeScript Setup Store重构完成
 * - 完整类型安全保障
 * - 智能日志集成完成
 * - 所有导出均为TypeScript版本
 */

// ==================== 游戏核心状态管理 ====================
// 导出现代化的TypeScript版本
export {
  useGameCoreStore
} from './gameState';

// ==================== 类型导出 ====================
// 重新导出类型定义
export type {
  GameCoreState,
  GameStatus,
  WeekData,
  PlayerAction
} from './gameState';
