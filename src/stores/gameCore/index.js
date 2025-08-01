/**
 * 游戏核心状态模块
 * 导出游戏核心状态管理功能
 *
 * 🎯 v0.1.4升级:
 * - TypeScript Setup Store重构
 * - 完整类型安全
 * - 智能日志集成
 */

// 导出现代化的TypeScript版本
export {
  useGameCoreStore
} from './gameState';

// 为了向后兼容，也提供旧的导入路径
// TODO: 在v0.2.0版本中移除对.js文件的支持
