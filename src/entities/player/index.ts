/**
 * 玩家实体统一导出
 */

// 导出主要实体类
export { Player, createPlayer, createPlayerProduct } from './model/Player';

// 导出类型定义
export type {
  InventoryItem,
  PurchasedHouse,
  PlayerStatistics,
  PlayerOptions,
  Product,
  House
} from './model/Player';

// 导出API接口
export * from './api';

// 导出组合函数
export * from './composables';