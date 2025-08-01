/**
 * 基础设施服务接口定义 - TypeScript版本
 * 这个文件定义了基础设施层服务的标准接口
 */

// ==================== 日志接口类型定义 ====================

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  error?: Error;
}

// ==================== 错误处理类型定义 ====================

/**
 * 错误信息对象接口
 */
export interface ErrorInfo {
  id: string;
  message: string;
  stack?: string;
  context: string;
  type: string;
  severity: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * 错误处理函数类型
 */
export type ErrorHandlingFunction<T extends (...args: any[]) => any> = T;

// ==================== 事件发射器类型定义 ====================

/**
 * 事件监听器函数类型
 */
export type EventListener = (...args: any[]) => void;

/**
 * 取消注册函数类型
 */
export type UnsubscribeFunction = () => void;

// ==================== 服务接口定义 ====================

/**
 * 存储服务接口
 * 负责数据持久化
 */
export interface IStorageService {
  /**
   * 保存数据
   * @param key 键
   * @param data 数据
   */
  save(key: string, data: any): Promise<void>;

  /**
   * 读取数据
   * @param key 键
   * @returns 数据
   */
  load(key: string): Promise<any>;

  /**
   * 删除数据
   * @param key 键
   * @returns 是否删除成功
   */
  delete(key: string): Promise<boolean>;

  /**
   * 检查数据是否存在
   * @param key 键
   * @returns 是否存在
   */
  exists(key: string): Promise<boolean>;

  /**
   * 列出所有键
   * @param prefix 前缀（可选）
   * @returns 键列表
   */
  listKeys(prefix?: string): Promise<string[]>;
}

/**
 * 日志服务接口
 * 负责日志记录
 */
export interface ILogService {
  /**
   * 记录信息日志
   * @param message 日志消息
   * @param data 附加数据（可选）
   */
  info(message: string, data?: Record<string, any>): void;

  /**
   * 记录警告日志
   * @param message 日志消息
   * @param data 附加数据（可选）
   */
  warn(message: string, data?: Record<string, any>): void;

  /**
   * 记录错误日志
   * @param message 日志消息
   * @param error 错误对象（可选）
   * @param data 附加数据（可选）
   */
  error(message: string, error?: Error, data?: Record<string, any>): void;

  /**
   * 记录调试日志
   * @param message 日志消息
   * @param data 附加数据（可选）
   */
  debug(message: string, data?: Record<string, any>): void;

  /**
   * 获取日志
   * @param date 日期（可选）
   * @param level 日志级别（可选）
   * @returns 日志列表
   */
  getLogs(date?: Date, level?: LogLevel): Promise<LogEntry[]>;
}

/**
 * 错误处理服务接口
 * 负责全局错误处理
 */
export interface IErrorHandlerService {
  /**
   * 处理错误
   * @param error 错误对象
   * @param context 错误上下文
   * @param type 错误类型
   * @param severity 错误严重程度
   * @returns 错误信息对象
   */
  handleError(error: Error, context: string, type: string, severity: string): ErrorInfo;

  /**
   * 带错误处理的函数包装
   * @param fn 待包装函数
   * @param context 错误上下文
   * @param type 错误类型
   * @param severity 错误严重程度
   * @returns 包装后的函数
   */
  withErrorHandling<T extends (...args: any[]) => any>(
    fn: T,
    context: string,
    type: string,
    severity: string
  ): ErrorHandlingFunction<T>;

  /**
   * 获取错误日志
   * @returns 错误日志列表
   */
  getErrorLogs(): ErrorInfo[];

  /**
   * 清除错误日志
   */
  clearErrorLogs(): void;
}

/**
 * 事件发射器接口
 * 负责事件通信
 */
export interface IEventEmitter {
  /**
   * 注册事件监听器
   * @param event 事件名称
   * @param listener 监听函数
   * @returns 取消注册函数
   */
  on(event: string, listener: EventListener): UnsubscribeFunction;

  /**
   * 注册一次性事件监听器
   * @param event 事件名称
   * @param listener 监听函数
   * @returns 取消注册函数
   */
  once(event: string, listener: EventListener): UnsubscribeFunction;

  /**
   * 取消注册事件监听器
   * @param event 事件名称
   * @param listener 监听函数
   */
  off(event: string, listener: EventListener): void;

  /**
   * 发射事件
   * @param event 事件名称
   * @param args 事件参数
   */
  emit(event: string, ...args: any[]): void;
}
