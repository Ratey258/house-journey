/**
 * 智能日志系统 - TypeScript版本
 * 基于Vue 3.5和现代日志管理最佳实践
 * 开发环境详细输出，生产环境自动移除
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum LogCategory {
  GAME = 'GAME',
  UI = 'UI',
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  context?: string;
  userId?: string;
  sessionId?: string;
  stack?: string;
}

export interface LoggerOptions {
  enableConsole?: boolean;
  enableStorage?: boolean;
  maxStorageEntries?: number;
  enablePerformanceLogging?: boolean;
  enableElectronLogging?: boolean;
}

/**
 * 智能日志器类
 */
class SmartLogger {
  private options: LoggerOptions;
  private isProduction: boolean;
  private sessionId: string;
  private logEntries: LogEntry[] = [];

  constructor(options: LoggerOptions = {}) {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.sessionId = this.generateSessionId();
    
    this.options = {
      enableConsole: !this.isProduction,
      enableStorage: true,
      maxStorageEntries: 1000,
      enablePerformanceLogging: !this.isProduction,
      enableElectronLogging: true,
      ...options
    };
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建日志条目
   */
  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    context?: string
  ): LogEntry {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      context,
      sessionId: this.sessionId,
      stack: level === LogLevel.ERROR || level === LogLevel.FATAL 
        ? new Error().stack 
        : undefined
    };
  }

  /**
   * 格式化控制台输出
   */
  private formatConsoleOutput(entry: LogEntry): void {
    if (!this.options.enableConsole) return;

    const styles = this.getConsoleStyles(entry.level);
    const prefix = `[${entry.category}][${entry.level.toUpperCase()}]`;
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    
    console.groupCollapsed(
      `%c${prefix}%c ${entry.message} %c(${timestamp})`,
      styles.prefix,
      styles.message,
      styles.timestamp
    );
    
    if (entry.context) {
      console.info('Context:', entry.context);
    }
    
    if (entry.data) {
      console.info('Data:', entry.data);
    }
    
    if (entry.stack && (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL)) {
      console.trace('Stack trace:');
    }
    
    console.groupEnd();
  }

  /**
   * 获取控制台样式
   */
  private getConsoleStyles(level: LogLevel): { prefix: string; message: string; timestamp: string } {
    const baseStyle = 'font-weight: bold; padding: 2px 6px; border-radius: 3px;';
    
    const levelStyles = {
      [LogLevel.DEBUG]: {
        prefix: baseStyle + 'background: #e9ecef; color: #495057;',
        message: 'color: #6c757d;',
        timestamp: 'color: #adb5bd; font-size: 0.9em;'
      },
      [LogLevel.INFO]: {
        prefix: baseStyle + 'background: #d1ecf1; color: #0c5460;',
        message: 'color: #17a2b8;',
        timestamp: 'color: #6c757d; font-size: 0.9em;'
      },
      [LogLevel.WARN]: {
        prefix: baseStyle + 'background: #fff3cd; color: #856404;',
        message: 'color: #ffc107;',
        timestamp: 'color: #6c757d; font-size: 0.9em;'
      },
      [LogLevel.ERROR]: {
        prefix: baseStyle + 'background: #f8d7da; color: #721c24;',
        message: 'color: #dc3545; font-weight: bold;',
        timestamp: 'color: #6c757d; font-size: 0.9em;'
      },
      [LogLevel.FATAL]: {
        prefix: baseStyle + 'background: #721c24; color: white;',
        message: 'color: #dc3545; font-weight: bold; text-decoration: underline;',
        timestamp: 'color: #6c757d; font-size: 0.9em;'
      }
    };

    return levelStyles[level];
  }

  /**
   * 存储日志到本地
   */
  private storeLog(entry: LogEntry): void {
    if (!this.options.enableStorage) return;

    try {
      this.logEntries.unshift(entry);
      
      // 限制存储数量
      if (this.logEntries.length > (this.options.maxStorageEntries || 1000)) {
        this.logEntries = this.logEntries.slice(0, this.options.maxStorageEntries || 1000);
      }
      
      // 只存储重要日志到localStorage（INFO及以上级别）
      if (entry.level !== LogLevel.DEBUG) {
        const importantLogs = this.logEntries.filter(log => log.level !== LogLevel.DEBUG);
        localStorage.setItem('smartLogger_logs', JSON.stringify(importantLogs.slice(0, 200)));
      }
    } catch (error) {
      console.warn('Failed to store log entry:', error);
    }
  }

  /**
   * 发送到Electron主进程
   */
  private sendToElectron(entry: LogEntry): void {
    if (!this.options.enableElectronLogging) return;
    
    try {
      if (window.electronAPI && window.electronAPI.logError) {
        window.electronAPI.logError({
          id: entry.id,
          message: entry.message,
          type: entry.category.toLowerCase(),
          severity: entry.level,
          context: entry.context || '',
          timestamp: entry.timestamp,
          metadata: entry.data || {}
        });
      }
    } catch (error) {
      console.warn('Failed to send log to Electron:', error);
    }
  }

  /**
   * 核心日志方法
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    context?: string
  ): void {
    const entry = this.createLogEntry(level, category, message, data, context);
    
    // 控制台输出
    this.formatConsoleOutput(entry);
    
    // 存储日志
    this.storeLog(entry);
    
    // 发送到Electron（仅错误和致命错误）
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      this.sendToElectron(entry);
    }
  }

  /**
   * 调试日志 - 生产环境自动移除
   */
  debug(category: LogCategory, message: string, data?: any, context?: string): void {
    if (this.isProduction) return; // 生产环境直接返回，会被Tree-shaking移除
    this.log(LogLevel.DEBUG, category, message, data, context);
  }

  /**
   * 信息日志 - 保留重要业务信息
   */
  info(category: LogCategory, message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, category, message, data, context);
  }

  /**
   * 警告日志
   */
  warn(category: LogCategory, message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, category, message, data, context);
  }

  /**
   * 错误日志
   */
  error(category: LogCategory, message: string, data?: any, context?: string): void {
    this.log(LogLevel.ERROR, category, message, data, context);
  }

  /**
   * 致命错误日志
   */
  fatal(category: LogCategory, message: string, data?: any, context?: string): void {
    this.log(LogLevel.FATAL, category, message, data, context);
  }

  /**
   * 性能日志
   */
  performance(message: string, startTime: number, data?: any): void {
    if (!this.options.enablePerformanceLogging) return;
    
    const duration = performance.now() - startTime;
    this.info(
      LogCategory.PERFORMANCE, 
      `${message} (${duration.toFixed(2)}ms)`,
      { duration, ...data },
      'performance'
    );
  }

  /**
   * 获取存储的日志
   */
  getLogs(): LogEntry[] {
    return [...this.logEntries];
  }

  /**
   * 获取特定级别的日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logEntries.filter(entry => entry.level === level);
  }

  /**
   * 获取特定分类的日志
   */
  getLogsByCategory(category: LogCategory): LogEntry[] {
    return this.logEntries.filter(entry => entry.category === category);
  }

  /**
   * 清除日志
   */
  clearLogs(): void {
    this.logEntries = [];
    try {
      localStorage.removeItem('smartLogger_logs');
    } catch (error) {
      console.warn('Failed to clear stored logs:', error);
    }
  }

  /**
   * 导出日志
   */
  async exportLogs(format: 'json' | 'csv' = 'json'): Promise<boolean> {
    try {
      const data = format === 'json' 
        ? JSON.stringify(this.logEntries, null, 2)
        : this.convertLogsToCSV();
      
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-logs-${new Date().toISOString().replace(/:/g, '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      this.error(LogCategory.SYSTEM, 'Failed to export logs', error);
      return false;
    }
  }

  /**
   * 转换日志为CSV格式
   */
  private convertLogsToCSV(): string {
    const headers = ['timestamp', 'level', 'category', 'message', 'context', 'sessionId'];
    const csvRows = [headers.join(',')];
    
    this.logEntries.forEach(entry => {
      const row = [
        entry.timestamp,
        entry.level,
        entry.category,
        `"${entry.message.replace(/"/g, '""')}"`,
        entry.context || '',
        entry.sessionId
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
}

// 创建全局日志器实例
const logger = new SmartLogger();

/**
 * 智能日志系统Composable
 * 基于Vue 3.5的现代化API
 */
export function useSmartLogger() {
  /**
   * 游戏相关日志
   */
  const gameLogger = {
    debug: (message: string, data?: any, context?: string) => 
      logger.debug(LogCategory.GAME, message, data, context),
    info: (message: string, data?: any, context?: string) => 
      logger.info(LogCategory.GAME, message, data, context),
    warn: (message: string, data?: any, context?: string) => 
      logger.warn(LogCategory.GAME, message, data, context),
    error: (message: string, data?: any, context?: string) => 
      logger.error(LogCategory.GAME, message, data, context)
  };

  /**
   * UI相关日志
   */
  const uiLogger = {
    debug: (message: string, data?: any, context?: string) => 
      logger.debug(LogCategory.UI, message, data, context),
    info: (message: string, data?: any, context?: string) => 
      logger.info(LogCategory.UI, message, data, context),
    warn: (message: string, data?: any, context?: string) => 
      logger.warn(LogCategory.UI, message, data, context),
    error: (message: string, data?: any, context?: string) => 
      logger.error(LogCategory.UI, message, data, context)
  };

  /**
   * 性能日志
   */
  const performanceLogger = {
    start: () => performance.now(),
    end: (message: string, startTime: number, data?: any) => 
      logger.performance(message, startTime, data)
  };

  /**
   * 网络日志
   */
  const networkLogger = {
    request: (url: string, method: string, data?: any) => 
      logger.info(LogCategory.NETWORK, `${method} ${url}`, data, 'request'),
    response: (url: string, status: number, data?: any) => 
      logger.info(LogCategory.NETWORK, `Response ${status} from ${url}`, data, 'response'),
    error: (url: string, error: any) => 
      logger.error(LogCategory.NETWORK, `Network error for ${url}`, error, 'network_error')
  };

  /**
   * 存储日志
   */
  const storageLogger = {
    save: (key: string, data?: any) => 
      logger.debug(LogCategory.STORAGE, `Saved ${key}`, data, 'save'),
    load: (key: string, data?: any) => 
      logger.debug(LogCategory.STORAGE, `Loaded ${key}`, data, 'load'),
    error: (operation: string, error: any) => 
      logger.error(LogCategory.STORAGE, `Storage error: ${operation}`, error, 'storage_error')
  };

  return {
    // 分类日志器
    game: gameLogger,
    ui: uiLogger,
    network: networkLogger,
    storage: storageLogger,
    performance: performanceLogger,
    
    // 通用方法
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    fatal: logger.fatal.bind(logger),
    
    // 管理方法
    getLogs: logger.getLogs.bind(logger),
    getLogsByLevel: logger.getLogsByLevel.bind(logger),
    getLogsByCategory: logger.getLogsByCategory.bind(logger),
    clearLogs: logger.clearLogs.bind(logger),
    exportLogs: logger.exportLogs.bind(logger)
  };
}

// 默认导出
export default logger;