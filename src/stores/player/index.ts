/**
 * 玩家模块导出文件 - TypeScript版本
 * 统一导出玩家相关模块
 */

// ==================== 玩家状态管理 ====================
// 导出玩家状态Store（已TypeScript化）
export { usePlayerStore } from './playerState';

// ==================== 玩家操作模块 ====================
// 导出背包操作和统计模块（待TypeScript化）
export { useInventoryActions } from './inventoryActions';
export { usePlayerStats } from './playerStats';

// ==================== 类型导出 ====================
// 重新导出类型定义
export type {
  PlayerState,
  PlayerStatistics,
  InventoryItem,
  PlayerActionResult
} from './playerState'; 