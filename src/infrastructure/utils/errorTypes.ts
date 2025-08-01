/**
 * 错误类型定义 - TypeScript版本
 * 提供完整的类型安全和枚举支持
 */

/**
 * 错误类型枚举
 */
export enum ErrorType {
  VALIDATION = 'validation',   // 数据验证错误
  NETWORK = 'network',         // 网络错误
  STORAGE = 'storage',         // 存储错误
  GAME_LOGIC = 'gameLogic',    // 游戏逻辑错误
  SYSTEM = 'system',           // 系统错误
  UNKNOWN = 'unknown'          // 未知错误
}

/**
 * 错误严重程度枚举
 */
export enum ErrorSeverity {
  FATAL = 'fatal',     // 致命错误，需要立即处理
  ERROR = 'error',     // 严重错误，可能影响功能
  WARNING = 'warning', // 警告，不影响主要功能
  INFO = 'info'        // 信息性错误
}

/**
 * 错误元数据接口
 */
export interface ErrorMetadata {
  [key: string]: any;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  data?: any;
}

/**
 * 增强的错误接口
 */
export interface EnhancedError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  metadata: ErrorMetadata;
  timestamp: string;
}

/**
 * 错误信息对象接口
 */
export interface ErrorInfo {
  id: string;
  message: string;
  type: ErrorType;
  severity: ErrorSeverity;
  context: string;
  timestamp: string;
  stack?: string;
  metadata: ErrorMetadata;
  userAgent?: string;
  url?: string;
}

/**
 * 创建增强的错误对象
 * @param message 错误消息
 * @param type 错误类型
 * @param severity 错误严重程度
 * @param metadata 额外元数据
 * @returns 增强的错误对象
 */
export function createError(
  message: string, 
  type: ErrorType = ErrorType.UNKNOWN, 
  severity: ErrorSeverity = ErrorSeverity.ERROR, 
  metadata: ErrorMetadata = {}
): EnhancedError {
  const error = new Error(message) as EnhancedError;
  error.type = type;
  error.severity = severity;
  error.metadata = metadata;
  error.timestamp = new Date().toISOString();
  return error;
}

/**
 * 验证错误
 * @param message 错误消息
 * @param metadata 额外元数据
 * @returns 验证错误对象
 */
export function validationError(message: string, metadata: ErrorMetadata = {}): EnhancedError {
  return createError(message, ErrorType.VALIDATION, ErrorSeverity.WARNING, metadata);
}

/**
 * 网络错误
 * @param message 错误消息
 * @param metadata 额外元数据
 * @returns 网络错误对象
 */
export function networkError(message: string, metadata: ErrorMetadata = {}): EnhancedError {
  return createError(message, ErrorType.NETWORK, ErrorSeverity.ERROR, metadata);
}

/**
 * 存储错误
 * @param message 错误消息
 * @param metadata 额外元数据
 * @returns 存储错误对象
 */
export function storageError(message: string, metadata: ErrorMetadata = {}): EnhancedError {
  return createError(message, ErrorType.STORAGE, ErrorSeverity.ERROR, metadata);
}

/**
 * 游戏逻辑错误
 * @param message 错误消息
 * @param metadata 额外元数据
 * @returns 游戏逻辑错误对象
 */
export function gameLogicError(message: string, metadata: ErrorMetadata = {}): EnhancedError {
  return createError(message, ErrorType.GAME_LOGIC, ErrorSeverity.WARNING, metadata);
}

/**
 * 系统错误
 * @param message 错误消息
 * @param metadata 额外元数据
 * @returns 系统错误对象
 */
export function systemError(message: string, metadata: ErrorMetadata = {}): EnhancedError {
  return createError(message, ErrorType.SYSTEM, ErrorSeverity.FATAL, metadata);
}

/**
 * 默认导出
 */
export default {
  ErrorType,
  ErrorSeverity,
  createError,
  validationError,
  networkError,
  storageError,
  gameLogicError,
  systemError
} as const;