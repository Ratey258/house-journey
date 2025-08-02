/**
 * 主Store入口文件 - TypeScript版本
 * 统一导出所有Store模块和类型定义
 */

// ==================== 核心Store模块导出 ====================
export { useGameCoreStore, type GameCoreStore } from './gameCore';
export { usePlayerStore, useInventoryActions, type PlayerStore, type InventoryActions } from './player';
export { useMarketStore, type MarketStore } from './market';
export { useEventStore, type EventStore } from './events';
export { useSaveStore, type SaveStore } from './persistence';

// ==================== 类型定义导出 ====================
export type {
  TransactionResult,
  ProductTransactionParams,
  HousePurchaseParams,
  NotificationType,
  GameStore
} from './types';

// ==================== 兼容层导出 ====================
export { useGameStore } from './compatibilityLayer';

// ==================== 向后兼容性说明 ====================
/**
 * 文件重构说明:
 * 
 * 原本486行的大文件已拆分为:
 * - types.ts - 类型定义 (80行)
 * - compatibilityLayer.ts - 兼容层实现 (270行)
 * - index.ts - 统一导出 (20行)
 * 现有组件仍可通过 `useGameStore` 使用原有API，无需修改。
 */