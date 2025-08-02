/**
 * 应用配置文件
 * 包含错误处理、日志记录、持久化等应用级配置
 */

/**
 * 错误处理配置接口
 */
export interface ErrorHandlingConfig {
  maxErrorLogs: number;
  activityTimeout: number;
  retryDelay: number;
  maxRetries: number;
}

/**
 * 日志配置接口
 */
export interface LoggingConfig {
  enableConsoleLog: boolean;
  enableFileLog: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxLogFiles: number;
  maxLogSize: number; // bytes
}

/**
 * 持久化配置接口
 */
export interface PersistenceConfig {
  maxAutoSaves: number;
  autoSaveInterval: number; // 周数
  maxSaveHistory: number;
  saveCompression: boolean;
}

/**
 * 应用配置接口
 */
export interface AppConfig {
  errorHandling: ErrorHandlingConfig;
  logging: LoggingConfig;
  persistence: PersistenceConfig;
  development: {
    enableDevTools: boolean;
    enableHotReload: boolean;
    showPerformancePanel: boolean;
  };
}

/**
 * 应用配置
 */
export const appConfig: AppConfig = {
  // 错误处理配置
  errorHandling: {
    maxErrorLogs: 200,            // 最大保留错误日志数
    activityTimeout: 300000,      // 5分钟无操作视为非活动状态
    retryDelay: 300,              // 重试延迟 (ms)
    maxRetries: 3                 // 最大重试次数
  },

  // 日志配置
  logging: {
    enableConsoleLog: true,       // 启用控制台日志
    enableFileLog: true,          // 启用文件日志 (Electron环境)
    logLevel: 'info',             // 日志级别
    maxLogFiles: 10,              // 最大日志文件数
    maxLogSize: 10 * 1024 * 1024  // 最大日志文件大小 (10MB)
  },

  // 持久化配置
  persistence: {
    maxAutoSaves: 3,              // 最大自动保存数量
    autoSaveInterval: 5,          // 自动保存间隔 (周数)
    maxSaveHistory: 50,           // 最大保存历史记录数
    saveCompression: true         // 启用保存数据压缩
  },

  // 开发环境配置
  development: {
    enableDevTools: import.meta.env.DEV,     // 开发工具
    enableHotReload: import.meta.env.DEV,    // 热重载
    showPerformancePanel: import.meta.env.DEV // 性能面板
  }
};

/**
 * 获取错误处理配置
 */
export const getErrorHandlingConfig = (): ErrorHandlingConfig => appConfig.errorHandling;

/**
 * 获取日志配置
 */
export const getLoggingConfig = (): LoggingConfig => appConfig.logging;

/**
 * 获取持久化配置  
 */
export const getPersistenceConfig = (): PersistenceConfig => appConfig.persistence;