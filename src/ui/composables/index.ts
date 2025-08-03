/**
 * Composables 模块索引文件
 *
 * 🎯 v0.1.4重大升级:
 * - 第三阶段深度现代化重构
 * - TypeScript Composables集成
 * - 事件驱动架构支持
 * - 桌面端特性完整集成
 * - 基于依赖注入的Service Composables
 */

// 🚀 现代化Service Composables (基于DI)
export { useMarketService } from './useMarketService';
export { usePlayerService } from './usePlayerService';
export { useEventEmitter } from './useEventEmitter';
export { useServices } from './useServices';

// 原有Composables (保持向后兼容)
export { default as useMarket } from './useMarket';
export { useDesktopMonitoring } from './useDesktopMonitoring';

// 游戏核心Composables
export { useGameState } from './useGameState';
export { useGameEvents } from './useGameEvents';
export { useDesktopGame } from './useDesktopGame';
export { useGameLoading } from './useGameLoading';

// 增强功能Composables
export { useEnhancedGame } from './useEnhancedGame';
export { useErrorRecovery } from './useErrorRecovery';
export { useTheme } from './useTheme';
export { useMemoryManager } from './useMemoryManager';
export { useResourceCache } from './useResourceCache';
export { useLazyLoading } from './useLazyLoading';
export { useDesktopLayout } from './useDesktopLayout';
export { useDesktopExperience } from './useDesktopExperience';

// 开发和调试Composables
export { useSmartLoggerDemo } from './useSmartLoggerDemo';

