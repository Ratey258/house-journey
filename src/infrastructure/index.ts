/**
 * 基础设施层索引文件 - TypeScript版本
 * 导出所有基础设施服务和工具
 */

// ==================== 持久化服务 ====================
// 导出存储服务
export * from './persistence/storageService';

// ==================== 事件系统 ====================
// 导出事件发射器
export { default as eventEmitter, EventEmitter } from './eventEmitter';
export type { EventListener, UnsubscribeFunction } from './eventEmitter';

// ==================== 工具函数 ====================
// 导出错误处理器
export * from '@/infrastructure/utils/errorHandler';

// 导出智能日志器
export * from '@/infrastructure/utils/smartLogger';

// 导出图片路径工具
export * from '@/infrastructure/utils/imagePathUtils';

// ==================== 依赖注入 ====================
// 导出依赖注入容器
export { default as container } from './di/container';
export { default as enhancedContainer } from './di/container-setup';
export * from './di';

// ==================== 状态管理 ====================
// 导出事件总线
export * from './state/event-bus';

// ==================== 类型导出 ====================

// 重新导出常用类型
export type {
  ErrorType,
  ErrorSeverity,
  ErrorContext,
  ErrorHandler
} from '@/infrastructure/utils/errorHandler';

export type {
  LogLevel,
  LogEntry,
  SmartLogger,
  LoggerConfig
} from '@/infrastructure/utils/smartLogger';

// ==================== 兼容性导出 ====================

/**
 * @deprecated 直接从 './eventEmitter' 导入
 */
import eventEmitterInstance from './eventEmitter';
export const legacyEventEmitter = eventEmitterInstance;