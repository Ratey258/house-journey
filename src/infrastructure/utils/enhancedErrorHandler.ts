/**
 * 增强版错误处理器
 * 提供更完善的错误处理、恢复和监控机制
 */
import { ref, reactive, computed } from 'vue';
import { ErrorType, ErrorSeverity, type ErrorInfo, type EnhancedError } from './errorTypes';
import type { 
  IEventEmitter, 
  ILogService 
} from '../interfaces/services';

// ==================== 错误恢复策略 ====================

/**
 * 错误恢复策略接口
 */
export interface ErrorRecoveryStrategy {
  /** 策略名称 */
  name: string;
  /** 是否可应用于此错误 */
  canHandle: (error: EnhancedError) => boolean;
  /** 执行恢复 */
  recover: (error: EnhancedError) => Promise<RecoveryResult>;
  /** 策略优先级 */
  priority: number;
  /** 最大重试次数 */
  maxRetries: number;
}

/**
 * 恢复结果接口
 */
export interface RecoveryResult {
  success: boolean;
  message?: string;
  data?: any;
  shouldRetry?: boolean;
  retryAfter?: number; // 毫秒
}

/**
 * 错误上下文接口
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  gameState?: any;
  browserInfo?: BrowserInfo;
  performanceInfo?: PerformanceInfo;
}

/**
 * 浏览器信息接口
 */
export interface BrowserInfo {
  userAgent: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  platform: string;
  screenResolution: string;
  viewportSize: string;
}

/**
 * 性能信息接口
 */
export interface PerformanceInfo {
  memoryUsage?: any;
  timing?: PerformanceTiming;
  connectionType?: string;
  effectiveType?: string;
}

/**
 * 错误统计接口
 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recentErrors: ErrorInfo[];
  recoverySuccessRate: number;
  averageRecoveryTime: number;
}

// ==================== 增强版错误处理器类 ====================

export class EnhancedErrorHandler {
  private recoveryStrategies: ErrorRecoveryStrategy[] = [];
  private errorHistory: ErrorInfo[] = [];
  private retryCounters: Map<string, number> = new Map();
  private contextProviders: Map<string, () => any> = new Map();
  
  // 响应式状态
  private state = reactive({
    isRecovering: false,
    lastError: null as ErrorInfo | null,
    recoveryInProgress: new Set<string>(),
    errorCount: 0,
    criticalErrorCount: 0
  });

  // 计算属性
  public readonly isHealthy = computed(() => 
    this.state.criticalErrorCount === 0 && this.state.errorCount < 10
  );

  public readonly statistics = computed<ErrorStatistics>(() => ({
    totalErrors: this.errorHistory.length,
    errorsByType: this.getErrorsByType(),
    errorsBySeverity: this.getErrorsBySeverity(),
    recentErrors: this.errorHistory.slice(-10),
    recoverySuccessRate: this.calculateRecoverySuccessRate(),
    averageRecoveryTime: this.calculateAverageRecoveryTime()
  }));

  constructor(
    private eventEmitter?: IEventEmitter,
    private logger?: ILogService
  ) {
    this.setupDefaultRecoveryStrategies();
    this.setupGlobalErrorHandling();
  }

  // ==================== 错误处理核心方法 ====================

  /**
   * 处理错误的主要方法
   */
  async handleError(
    error: Error | EnhancedError, 
    context?: ErrorContext
  ): Promise<RecoveryResult> {
    const enhancedError = this.enhanceError(error, context);
    const errorInfo = this.createErrorInfo(enhancedError, context);
    
    // 记录错误
    this.recordError(errorInfo);
    
    // 发布错误事件
    this.eventEmitter?.emit('error:occurred', { error: errorInfo, context });
    
    // 尝试恢复
    const recoveryResult = await this.attemptRecovery(enhancedError);
    
    // 发布恢复结果事件
    this.eventEmitter?.emit('error:recovery', { 
      error: errorInfo, 
      result: recoveryResult,
      context 
    });
    
    return recoveryResult;
  }

  /**
   * 增强错误对象
   */
  private enhanceError(error: Error | EnhancedError, context?: ErrorContext): EnhancedError {
    if (this.isEnhancedError(error)) {
      return error;
    }

    const enhancedError = error as EnhancedError;
    enhancedError.type = this.determineErrorType(error);
    enhancedError.severity = this.determineSeverity(error);
    enhancedError.metadata = {
      ...context,
      timestamp: new Date().toISOString(),
      browserInfo: this.getBrowserInfo(),
      performanceInfo: this.getPerformanceInfo()
    };
    enhancedError.timestamp = new Date().toISOString();

    return enhancedError;
  }

  /**
   * 创建错误信息对象
   */
  private createErrorInfo(error: EnhancedError, context?: ErrorContext): ErrorInfo {
    return {
      id: this.generateErrorId(),
      message: error.message,
      type: error.type,
      severity: error.severity,
      context: context?.component || 'unknown',
      timestamp: error.timestamp,
      stack: error.stack,
      metadata: error.metadata,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  /**
   * 尝试错误恢复
   */
  private async attemptRecovery(error: EnhancedError): Promise<RecoveryResult> {
    const errorId = this.generateErrorId();
    
    if (this.state.recoveryInProgress.has(errorId)) {
      return { success: false, message: '恢复已在进行中' };
    }

    this.state.recoveryInProgress.add(errorId);
    this.state.isRecovering = true;

    try {
      // 获取适用的恢复策略
      const strategies = this.getApplicableStrategies(error);
      
      // 按优先级排序
      strategies.sort((a, b) => b.priority - a.priority);
      
      for (const strategy of strategies) {
        const retryKey = `${strategy.name}:${error.type}:${error.message}`;
        const retryCount = this.retryCounters.get(retryKey) || 0;
        
        if (retryCount >= strategy.maxRetries) {
          continue;
        }
        
        try {
          this.logger?.info(`尝试错误恢复策略: ${strategy.name}`, {
            error: error.message,
            attempt: retryCount + 1
          });
          
          const result = await strategy.recover(error);
          
          if (result.success) {
            this.retryCounters.delete(retryKey);
            this.logger?.info(`错误恢复成功: ${strategy.name}`);
            return result;
          } else if (result.shouldRetry) {
            this.retryCounters.set(retryKey, retryCount + 1);
          }
        } catch (recoveryError) {
          this.logger?.error(`恢复策略执行失败: ${strategy.name}`, recoveryError);
          this.retryCounters.set(retryKey, retryCount + 1);
        }
      }
      
      return { 
        success: false, 
        message: '所有恢复策略都已尝试但未成功' 
      };
      
    } finally {
      this.state.recoveryInProgress.delete(errorId);
      this.state.isRecovering = this.state.recoveryInProgress.size > 0;
    }
  }

  // ==================== 恢复策略管理 ====================

  /**
   * 注册恢复策略
   */
  registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
    this.recoveryStrategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取适用的恢复策略
   */
  private getApplicableStrategies(error: EnhancedError): ErrorRecoveryStrategy[] {
    return this.recoveryStrategies.filter(strategy => strategy.canHandle(error));
  }

  /**
   * 设置默认恢复策略
   */
  private setupDefaultRecoveryStrategies(): void {
    // 数据存储错误恢复策略
    this.registerRecoveryStrategy({
      name: 'storage-retry',
      priority: 80,
      maxRetries: 3,
      canHandle: (error) => error.type === ErrorType.STORAGE,
      recover: async (error) => {
        // 尝试清理存储并重新初始化
        try {
          if (typeof localStorage !== 'undefined') {
            // 备份重要数据
            const backup = this.backupCriticalData();
            
            // 清理可能损坏的数据
            this.clearCorruptedStorage();
            
            // 恢复重要数据
            if (backup) {
              this.restoreCriticalData(backup);
            }
            
            return { 
              success: true, 
              message: '存储已清理并重新初始化' 
            };
          }
          
          return { success: false, message: '存储不可用' };
        } catch (e) {
          return { 
            success: false, 
            message: `存储恢复失败: ${e.message}`,
            shouldRetry: true,
            retryAfter: 1000
          };
        }
      }
    });

    // 网络错误恢复策略
    this.registerRecoveryStrategy({
      name: 'network-retry',
      priority: 70,
      maxRetries: 5,
      canHandle: (error) => error.type === ErrorType.NETWORK,
      recover: async (error) => {
        try {
          // 检查网络连接
          if (!navigator.onLine) {
            return { 
              success: false, 
              message: '网络连接不可用',
              shouldRetry: true,
              retryAfter: 5000
            };
          }
          
          // 尝试简单的网络请求
          const response = await fetch('/api/health', { 
            method: 'HEAD',
            cache: 'no-cache'
          });
          
          if (response.ok) {
            return { 
              success: true, 
              message: '网络连接已恢复' 
            };
          }
          
          return { 
            success: false, 
            message: '服务器不可用',
            shouldRetry: true,
            retryAfter: 3000
          };
        } catch (e) {
          return { 
            success: false, 
            message: '网络测试失败',
            shouldRetry: true,
            retryAfter: 2000
          };
        }
      }
    });

    // 游戏状态恢复策略
    this.registerRecoveryStrategy({
      name: 'gamestate-recovery',
      priority: 60,
      maxRetries: 2,
      canHandle: (error) => error.type === ErrorType.GAME_LOGIC,
      recover: async (error) => {
        try {
          // 获取游戏状态提供者
          const gameStateProvider = this.contextProviders.get('gameState');
          
          if (gameStateProvider) {
            const gameState = gameStateProvider();
            
            // 检查游戏状态是否有效
            if (this.validateGameState(gameState)) {
              return { 
                success: true, 
                message: '游戏状态有效，无需恢复' 
              };
            }
            
            // 尝试从最近的保存点恢复
            const restored = await this.restoreFromSavePoint();
            
            if (restored) {
              return { 
                success: true, 
                message: '已从保存点恢复游戏状态' 
              };
            }
          }
          
          return { 
            success: false, 
            message: '无法恢复游戏状态',
            shouldRetry: false
          };
        } catch (e) {
          return { 
            success: false, 
            message: `游戏状态恢复失败: ${e.message}`,
            shouldRetry: true,
            retryAfter: 1500
          };
        }
      }
    });

    // UI组件恢复策略
    this.registerRecoveryStrategy({
      name: 'ui-refresh',
      priority: 50,
      maxRetries: 2,
      canHandle: (error) => error.type === ErrorType.UI,
      recover: async (error) => {
        try {
          // 发布UI刷新事件
          this.eventEmitter?.emit('ui:refresh', { 
            component: error.metadata.component 
          });
          
          // 等待一段时间让UI重新渲染
          await new Promise(resolve => setTimeout(resolve, 500));
          
          return { 
            success: true, 
            message: 'UI组件已刷新' 
          };
        } catch (e) {
          return { 
            success: false, 
            message: `UI刷新失败: ${e.message}`,
            shouldRetry: true,
            retryAfter: 1000
          };
        }
      }
    });
  }

  // ==================== 上下文管理 ====================

  /**
   * 注册上下文提供者
   */
  registerContextProvider(name: string, provider: () => any): void {
    this.contextProviders.set(name, provider);
  }

  /**
   * 获取当前上下文
   */
  getContext(): ErrorContext {
    const context: ErrorContext = {};
    
    for (const [name, provider] of this.contextProviders) {
      try {
        context[name] = provider();
      } catch (e) {
        this.logger?.warn(`上下文提供者 ${name} 执行失败:`, e);
      }
    }
    
    return context;
  }

  // ==================== 工具方法 ====================

  /**
   * 检查是否为增强错误
   */
  private isEnhancedError(error: any): error is EnhancedError {
    return error && typeof error.type === 'string' && typeof error.severity === 'string';
  }

  /**
   * 确定错误类型
   */
  private determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('storage') || message.includes('localstorage')) {
      return ErrorType.STORAGE;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    
    return ErrorType.UNKNOWN;
  }

  /**
   * 确定错误严重程度
   */
  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('fatal') || message.includes('critical')) {
      return ErrorSeverity.FATAL;
    }
    if (message.includes('warning') || message.includes('warn')) {
      return ErrorSeverity.WARNING;
    }
    
    return ErrorSeverity.ERROR;
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 记录错误
   */
  private recordError(errorInfo: ErrorInfo): void {
    this.errorHistory.push(errorInfo);
    this.state.errorCount++;
    this.state.lastError = errorInfo;
    
    if (errorInfo.severity === ErrorSeverity.FATAL) {
      this.state.criticalErrorCount++;
    }
    
    // 保持错误历史在合理范围内
    if (this.errorHistory.length > 100) {
      this.errorHistory.splice(0, 50);
    }
    
    // 记录日志
    this.logger?.error(`错误发生: ${errorInfo.message}`, {
      type: errorInfo.type,
      severity: errorInfo.severity,
      context: errorInfo.context
    });
  }

  /**
   * 获取浏览器信息
   */
  private getBrowserInfo(): BrowserInfo {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`
    };
  }

  /**
   * 获取性能信息
   */
  private getPerformanceInfo(): PerformanceInfo {
    const info: PerformanceInfo = {};
    
    if ('memory' in performance) {
      info.memoryUsage = (performance as any).memory;
    }
    
    if ('timing' in performance) {
      info.timing = performance.timing;
    }
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      info.connectionType = connection?.type;
      info.effectiveType = connection?.effectiveType;
    }
    
    return info;
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalErrorHandling(): void {
    // 处理未捕获的错误
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        component: 'global',
        action: 'unhandled-error'
      });
    });

    // 处理未捕获的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        component: 'global',
        action: 'unhandled-promise-rejection'
      });
    });

    // 处理Vue错误
    if (typeof window !== 'undefined' && (window as any).app) {
      (window as any).app.config.errorHandler = (error: Error, context: any) => {
        this.handleError(error, {
          component: context?.$options?.name || 'unknown-vue-component',
          action: 'vue-error'
        });
      };
    }
  }

  // ==================== 统计和分析方法 ====================

  private getErrorsByType(): Record<ErrorType, number> {
    const counts = {} as Record<ErrorType, number>;
    
    Object.values(ErrorType).forEach(type => {
      counts[type] = 0;
    });
    
    this.errorHistory.forEach(error => {
      counts[error.type]++;
    });
    
    return counts;
  }

  private getErrorsBySeverity(): Record<ErrorSeverity, number> {
    const counts = {} as Record<ErrorSeverity, number>;
    
    Object.values(ErrorSeverity).forEach(severity => {
      counts[severity] = 0;
    });
    
    this.errorHistory.forEach(error => {
      counts[error.severity]++;
    });
    
    return counts;
  }

  private calculateRecoverySuccessRate(): number {
    // 这里可以实现基于实际恢复记录的成功率计算
    // 暂时返回一个模拟值
    return 0.85;
  }

  private calculateAverageRecoveryTime(): number {
    // 这里可以实现基于实际恢复时间的平均值计算
    // 暂时返回一个模拟值（毫秒）
    return 1500;
  }

  // ==================== 辅助恢复方法 ====================

  private backupCriticalData(): any {
    try {
      const criticalKeys = ['gameState', 'playerData', 'settings'];
      const backup: any = {};
      
      criticalKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          backup[key] = data;
        }
      });
      
      return backup;
    } catch (e) {
      this.logger?.warn('备份关键数据失败:', e);
      return null;
    }
  }

  private clearCorruptedStorage(): void {
    try {
      // 清理可能损坏的缓存数据
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      this.logger?.warn('清理损坏存储失败:', e);
    }
  }

  private restoreCriticalData(backup: any): void {
    try {
      Object.entries(backup).forEach(([key, value]) => {
        localStorage.setItem(key, value as string);
      });
    } catch (e) {
      this.logger?.warn('恢复关键数据失败:', e);
    }
  }

  private validateGameState(gameState: any): boolean {
    if (!gameState) return false;
    
    // 基本的游戏状态验证
    return !!(
      gameState.player &&
      typeof gameState.currentWeek === 'number' &&
      Array.isArray(gameState.player.inventory)
    );
  }

  private async restoreFromSavePoint(): Promise<boolean> {
    try {
      // 这里应该实现从保存点恢复的逻辑
      // 暂时返回false表示暂未实现
      return false;
    } catch (e) {
      this.logger?.error('从保存点恢复失败:', e);
      return false;
    }
  }

  // ==================== 公共接口 ====================

  /**
   * 获取错误历史
   */
  getErrorHistory(): ErrorInfo[] {
    return [...this.errorHistory];
  }

  /**
   * 清除错误历史
   */
  clearErrorHistory(): void {
    this.errorHistory.length = 0;
    this.state.errorCount = 0;
    this.state.criticalErrorCount = 0;
    this.state.lastError = null;
  }

  /**
   * 获取当前状态
   */
  getState() {
    return { ...this.state };
  }

  /**
   * 导出错误报告
   */
  exportErrorReport(): any {
    return {
      timestamp: new Date().toISOString(),
      statistics: this.statistics.value,
      recentErrors: this.errorHistory.slice(-20),
      browserInfo: this.getBrowserInfo(),
      performanceInfo: this.getPerformanceInfo()
    };
  }
}

// ==================== 全局实例 ====================

let globalErrorHandler: EnhancedErrorHandler | null = null;

/**
 * 获取全局错误处理器实例
 */
export function getGlobalErrorHandler(): EnhancedErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new EnhancedErrorHandler();
  }
  return globalErrorHandler;
}

/**
 * 初始化全局错误处理器
 */
export function initializeErrorHandler(
  eventEmitter?: IEventEmitter,
  logger?: ILogService
): EnhancedErrorHandler {
  globalErrorHandler = new EnhancedErrorHandler(eventEmitter, logger);
  return globalErrorHandler;
}

/**
 * 便捷的错误处理函数
 */
export async function handleError(
  error: Error | EnhancedError,
  context?: ErrorContext
): Promise<RecoveryResult> {
  return getGlobalErrorHandler().handleError(error, context);
}

/**
 * 便捷的错误处理装饰器
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: Partial<ErrorContext>
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleError(error, {
        ...context,
        action: fn.name || 'anonymous-function'
      });
      throw error;
    }
  }) as T;
}