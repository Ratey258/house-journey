/**
 * 市场模块导出文件 - TypeScript版本
 * 统一导出市场相关模块
 *
 * 🎯 P6阶段升级:
 * - TypeScript Setup Store重构完成
 * - 完整类型安全市场管理
 * - 智能日志和性能监控集成
 * - 事件驱动架构完善
 * - 价格行为和地点系统现代化
 */

// ==================== 市场状态管理 ====================
// 导出现代化的TypeScript版本
export {
  useMarketStore
} from './marketState';

// ==================== 业务操作模块 ====================
// 导出价格行为和地点系统（待TypeScript化）
export { usePriceActions } from './priceActions';
export { useLocationSystem } from './locationSystem';

// ==================== 类型导出 ====================
// 重新导出类型定义
export type {
  MarketState,
  ProductPrice,
  Location,
  MarketModifiers,
  PriceData
} from './marketState';
