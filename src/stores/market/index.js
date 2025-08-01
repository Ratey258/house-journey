/**
 * 市场模块导出文件
 * 统一导出市场相关模块
 *
 * 🎯 v0.1.4升级:
 * - TypeScript Setup Store重构
 * - 完整类型安全市场管理
 * - 智能日志和性能监控
 * - 事件驱动架构准备
 */

// 导出现代化的TypeScript版本
export {
  useMarketStore
} from './marketState';

// 导出价格行为和地点系统
export { usePriceActions } from './priceActions';
export { useLocationSystem } from './locationSystem';

// 为了向后兼容，保持旧的导入路径
// TODO: 在v0.2.0版本中移除对.js文件的支持
