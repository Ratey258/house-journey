/**
 * Composables 模块索引文件
 *
 * 🎯 v0.1.4重大升级:
 * - 第三阶段深度现代化重构
 * - TypeScript Composables集成
 * - 事件驱动架构支持
 * - 桌面端特性完整集成
 */

// 原有Composables (JavaScript)
export { default as useMarket } from './useMarket';
export { useDesktopMonitoring } from './useDesktopMonitoring';

// 🚀 第三阶段新增Composables (TypeScript)
export { useGameState } from './useGameState';
export { useGameEvents } from './useGameEvents';
export { useDesktopGame } from './useDesktopGame';
export { useGameLoading } from './useGameLoading';

// 检查是否有其他相关Composables
export { useEnhancedGame } from './useEnhancedGame';
export { useSmartLoggerDemo } from './useSmartLoggerDemo';

