/**
 * 错误类型枚举
 * 定义系统中的错误类型
 */

/**
 * 错误类型常量
 */
export const ErrorType = {
  VALIDATION: 'validation',   // 数据验证错误
  NETWORK: 'network',         // 网络错误
  STORAGE: 'storage',         // 存储错误
  GAME_LOGIC: 'gameLogic',    // 游戏逻辑错误
  SYSTEM: 'system',           // 系统错误
  UNKNOWN: 'unknown'          // 未知错误
};

/**
 * 错误严重程度枚举
 */
export const ErrorSeverity = {
  FATAL: 'fatal',     // 致命错误，需要立即处理
  ERROR: 'error',     // 严重错误，可能影响功能
  WARNING: 'warning', // 警告，不影响主要功能
  INFO: 'info'        // 信息性错误
};

/**
 * 创建错误对象
 * @param {string} message 错误消息
 * @param {string} type 错误类型
 * @param {string} severity 错误严重程度
 * @param {Object} metadata 额外元数据
 * @returns {Error} 增强的错误对象
 */
export function createError(message, type = ErrorType.UNKNOWN, severity = ErrorSeverity.ERROR, metadata = {}) {
  const error = new Error(message);
  error.type = type;
  error.severity = severity;
  error.metadata = metadata;
  error.timestamp = new Date().toISOString();
  return error;
}

/**
 * 验证错误
 * @param {string} message 错误消息
 * @param {Object} metadata 额外元数据
 * @returns {Error} 验证错误对象
 */
export function validationError(message, metadata = {}) {
  return createError(message, ErrorType.VALIDATION, ErrorSeverity.WARNING, metadata);
}

/**
 * 网络错误
 * @param {string} message 错误消息
 * @param {Object} metadata 额外元数据
 * @returns {Error} 网络错误对象
 */
export function networkError(message, metadata = {}) {
  return createError(message, ErrorType.NETWORK, ErrorSeverity.ERROR, metadata);
}

/**
 * 存储错误
 * @param {string} message 错误消息
 * @param {Object} metadata 额外元数据
 * @returns {Error} 存储错误对象
 */
export function storageError(message, metadata = {}) {
  return createError(message, ErrorType.STORAGE, ErrorSeverity.ERROR, metadata);
}

/**
 * 游戏逻辑错误
 * @param {string} message 错误消息
 * @param {Object} metadata 额外元数据
 * @returns {Error} 游戏逻辑错误对象
 */
export function gameLogicError(message, metadata = {}) {
  return createError(message, ErrorType.GAME_LOGIC, ErrorSeverity.WARNING, metadata);
}

/**
 * 系统错误
 * @param {string} message 错误消息
 * @param {Object} metadata 额外元数据
 * @returns {Error} 系统错误对象
 */
export function systemError(message, metadata = {}) {
  return createError(message, ErrorType.SYSTEM, ErrorSeverity.FATAL, metadata);
}

export default {
  ErrorType,
  ErrorSeverity,
  createError,
  validationError,
  networkError,
  storageError,
  gameLogicError,
  systemError
}; 