/**
 * 事件模块导出文件 - TypeScript版本
 * 统一导出事件相关模块
 */

export { useEventStore } from './eventState';
export { useEventActions } from './eventActions';
export { useEventItemHandler } from './eventItemHandler';

// 导出类型定义
export type {
  TriggeredEventRecord,
  EventStatistics,
  EventState
} from './eventState';

export type {
  PlayerData,
  MarketData,
  EventHandleResult,
  EffectResult,
  StateChanges,
  StateSnapshot
} from './eventActions';

export type {
  ItemOperationResult,
  InventoryItem
} from './eventItemHandler';
