/**
 * 基础设施工具函数索引 - TypeScript版本
 * 导出所有工具函数，便于统一引用
 */

// ==================== 错误处理工具 ====================
// 导出错误处理工具（已现代化）
export * from './errorHandler';
export * from './errorTypes';

// ==================== 日志系统 ====================
// 导出智能日志系统（已现代化）
export * from './smartLogger';

// ==================== 格式化工具 ====================
// 导出格式化工具函数（P6阶段正在现代化）
export * from './formatUtils';

// ==================== 图片路径工具 ====================
// 导出图片路径工具（已现代化）
export * from './imagePathUtils';

// ==================== 类型定义导出 ====================
// 为了更好的TypeScript支持，重新导出关键类型
export type {
  ErrorInfo,
  ErrorType,
  ErrorSeverity,
  SmartLoggerConfig,
  LogEntry as SmartLogEntry
} from './errorTypes';

export type {
  EventListener,
  UnsubscribeFunction,
  LogLevel,
  LogEntry,
  IStorageService,
  ILogService,
  IErrorHandlerService,
  IEventEmitter
} from '../interfaces/services';
