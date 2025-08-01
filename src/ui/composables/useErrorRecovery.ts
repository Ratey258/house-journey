/**
 * 错误恢复系统 Composable
 * 提供全局错误恢复策略和异常处理机制
 */
import { ref, computed, onMounted, onBeforeUnmount, reactive, readonly } from 'vue';
import { useSmartLogger } from '../../infrastructure/utils/smartLogger';
import { handleError, ErrorType, ErrorSeverity, type ErrorInfo } from '../../infrastructure/utils/errorHandler';

// 恢复策略接口
export interface RecoveryStrategy {
  id: string;
  name: string;
  priority: number;
  conditions: (error: Error, context: ErrorContext) => boolean;
  execute: (error: Error, context: ErrorContext) => Promise<RecoveryResult>;
  fallback?: string; // 回退策略ID
}

// 错误上下文接口
export interface ErrorContext {
  componentId?: string;
  route?: string;
  user?: any;
  timestamp: number;
  metadata: Record<string, any>;
  previousErrors: ErrorInfo[];
  retryCount: number;
}

// 恢复结果接口
export interface RecoveryResult {
  success: boolean;
  strategy: string;
  message: string;
  data?: any;
  nextAction?: 'retry' | 'fallback' | 'escalate' | 'abort';
}

// 错误统计接口
export interface ErrorStats {
  totalErrors: number;
  recoveredErrors: number;
  failedRecoveries: number;
  recoveryRate: number;
  commonErrorTypes: Record<string, number>;
  criticalErrors: number;
  lastErrorTime: number;
}

// 系统健康状态
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'recovering';
  score: number; // 0-100
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
  }>;
  recommendations: string[];
}

export function useErrorRecovery() {
  const logger = useSmartLogger();

  // 恢复策略注册表
  const strategies = new Map<string, RecoveryStrategy>();

  // 错误历史
  const errorHistory = ref<ErrorInfo[]>([]);
  const maxHistorySize = 100;

  // 系统状态
  const systemHealth = reactive<SystemHealth>({
    status: 'healthy',
    score: 100,
    issues: [],
    recommendations: []
  });

  // 错误统计
  const errorStats = reactive<ErrorStats>({
    totalErrors: 0,
    recoveredErrors: 0,
    failedRecoveries: 0,
    recoveryRate: 0,
    commonErrorTypes: {},
    criticalErrors: 0,
    lastErrorTime: 0
  });

  // 活跃恢复任务
  const activeRecoveries = ref(new Map<string, {
    error: Error;
    context: ErrorContext;
    strategy: string;
    startTime: number;
    promise: Promise<RecoveryResult>;
  }>());

  // 注册默认恢复策略
  const registerDefaultStrategies = (): void => {
    // 网络错误恢复
    registerStrategy({
      id: 'network-retry',
      name: '网络重试',
      priority: 10,
      conditions: (error) =>
        error.message.toLowerCase().includes('network') ||
        error.message.toLowerCase().includes('fetch') ||
        error.message.toLowerCase().includes('timeout'),
      execute: async (error, context) => {
        await new Promise(resolve => setTimeout(resolve, 1000 * (context.retryCount + 1)));

        // 模拟网络重试
        try {
          // 这里应该重新执行失败的网络请求
          return {
            success: true,
            strategy: 'network-retry',
            message: '网络连接已恢复',
            nextAction: 'retry'
          };
        } catch (retryError) {
          return {
            success: false,
            strategy: 'network-retry',
            message: '网络重试失败',
            nextAction: context.retryCount < 3 ? 'retry' : 'fallback'
          };
        }
      },
      fallback: 'cache-fallback'
    });

    // 缓存回退策略
    registerStrategy({
      id: 'cache-fallback',
      name: '缓存回退',
      priority: 8,
      conditions: (error, context) =>
        context.previousErrors.some(e => e.type === ErrorType.NETWORK),
      execute: async (error, context) => {
        // 尝试从缓存加载数据
        try {
          const cachedData = localStorage.getItem(`cache_${context.componentId}`);
          if (cachedData) {
            return {
              success: true,
              strategy: 'cache-fallback',
              message: '已从缓存加载数据',
              data: JSON.parse(cachedData),
              nextAction: 'retry'
            };
          } else {
            return {
              success: false,
              strategy: 'cache-fallback',
              message: '无可用缓存数据',
              nextAction: 'fallback'
            };
          }
        } catch (cacheError) {
          return {
            success: false,
            strategy: 'cache-fallback',
            message: '缓存读取失败',
            nextAction: 'escalate'
          };
        }
      },
      fallback: 'component-reset'
    });

    // 组件重置策略
    registerStrategy({
      id: 'component-reset',
      name: '组件重置',
      priority: 6,
      conditions: (error) =>
        error.message.toLowerCase().includes('render') ||
        error.message.toLowerCase().includes('component'),
      execute: async (error, context) => {
        // 清理组件状态
        try {
          // 清理本地存储
          const keysToRemove = Object.keys(localStorage)
            .filter(key => key.includes(context.componentId || ''));
          keysToRemove.forEach(key => localStorage.removeItem(key));

          // 触发组件重新初始化
          window.dispatchEvent(new CustomEvent('component-reset', {
            detail: { componentId: context.componentId }
          }));

          return {
            success: true,
            strategy: 'component-reset',
            message: '组件已重置',
            nextAction: 'retry'
          };
        } catch (resetError) {
          return {
            success: false,
            strategy: 'component-reset',
            message: '组件重置失败',
            nextAction: 'escalate'
          };
        }
      },
      fallback: 'page-reload'
    });

    // 页面重载策略
    registerStrategy({
      id: 'page-reload',
      name: '页面重载',
      priority: 4,
      conditions: (error, context) =>
        context.retryCount >= 3 || error.message.toLowerCase().includes('critical'),
      execute: async (error, context) => {
        // 保存当前状态
        try {
          const currentState = {
            route: context.route,
            timestamp: Date.now(),
            error: error.message
          };
          localStorage.setItem('recovery_state', JSON.stringify(currentState));

          // 延迟重载以显示消息
          setTimeout(() => {
            window.location.reload();
          }, 2000);

          return {
            success: true,
            strategy: 'page-reload',
            message: '页面将在2秒后重新加载',
            nextAction: 'abort'
          };
        } catch (reloadError) {
          return {
            success: false,
            strategy: 'page-reload',
            message: '页面重载失败',
            nextAction: 'escalate'
          };
        }
      }
    });

    // 内存清理策略
    registerStrategy({
      id: 'memory-cleanup',
      name: '内存清理',
      priority: 7,
      conditions: (error) =>
        error.message.toLowerCase().includes('memory') ||
        error.message.toLowerCase().includes('heap'),
      execute: async (error, context) => {
        try {
          // 清理缓存
          const cacheKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('cache_'));
          cacheKeys.forEach(key => localStorage.removeItem(key));

          // 触发垃圾回收（如果支持）
          if (window.gc) {
            window.gc();
          }

          // 清理大型对象
          window.dispatchEvent(new CustomEvent('memory-cleanup'));

          return {
            success: true,
            strategy: 'memory-cleanup',
            message: '内存清理完成',
            nextAction: 'retry'
          };
        } catch (cleanupError) {
          return {
            success: false,
            strategy: 'memory-cleanup',
            message: '内存清理失败',
            nextAction: 'fallback'
          };
        }
      },
      fallback: 'page-reload'
    });

    logger.info('默认恢复策略已注册');
  };

  // 注册恢复策略
  const registerStrategy = (strategy: RecoveryStrategy): void => {
    strategies.set(strategy.id, strategy);
    logger.info(`注册恢复策略: ${strategy.name} (${strategy.id})`);
  };

  // 移除恢复策略
  const unregisterStrategy = (strategyId: string): boolean => {
    const removed = strategies.delete(strategyId);
    if (removed) {
      logger.info(`移除恢复策略: ${strategyId}`);
    }
    return removed;
  };

  // 执行错误恢复
  const recoverFromError = async (
    error: Error,
    context: Partial<ErrorContext> = {}
  ): Promise<RecoveryResult> => {
    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      metadata: {},
      previousErrors: errorHistory.value.slice(-10),
      retryCount: 0,
      ...context
    };

    const recoveryId = `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.warn(`开始错误恢复: ${recoveryId}`, {
      error: error.message,
      context: fullContext
    });

    // 更新统计
    updateErrorStats(error);

    // 添加到错误历史
    const errorInfo: ErrorInfo = {
      id: recoveryId,
      message: error.message,
      context: fullContext.componentId || 'unknown',
      type: getErrorType(error),
      severity: getErrorSeverity(error),
      timestamp: new Date().toISOString(),
      stack: error.stack,
      metadata: fullContext.metadata
    };

    addToErrorHistory(errorInfo);

    // 选择恢复策略
    const availableStrategies = Array.from(strategies.values())
      .filter(strategy => strategy.conditions(error, fullContext))
      .sort((a, b) => b.priority - a.priority);

    if (availableStrategies.length === 0) {
      logger.error('没有可用的恢复策略');
      return {
        success: false,
        strategy: 'none',
        message: '没有可用的恢复策略',
        nextAction: 'escalate'
      };
    }

    // 尝试恢复策略
    for (const strategy of availableStrategies) {
      try {
        logger.info(`尝试恢复策略: ${strategy.name}`);

        const recoveryPromise = strategy.execute(error, fullContext);
        activeRecoveries.value.set(recoveryId, {
          error,
          context: fullContext,
          strategy: strategy.id,
          startTime: Date.now(),
          promise: recoveryPromise
        });

        const result = await recoveryPromise;
        activeRecoveries.value.delete(recoveryId);

        if (result.success) {
          logger.info(`恢复成功: ${strategy.name}`, result);
          errorStats.recoveredErrors++;
          updateRecoveryRate();
          updateSystemHealth();
          return result;
        } else {
          logger.warn(`恢复失败: ${strategy.name}`, result);

          // 尝试回退策略
          if (strategy.fallback && result.nextAction === 'fallback') {
            const fallbackStrategy = strategies.get(strategy.fallback);
            if (fallbackStrategy) {
              logger.info(`尝试回退策略: ${fallbackStrategy.name}`);
              continue;
            }
          }
        }
      } catch (strategyError) {
        logger.error(`恢复策略执行失败: ${strategy.name}`, strategyError);
        activeRecoveries.value.delete(recoveryId);
      }
    }

    // 所有策略都失败
    errorStats.failedRecoveries++;
    updateRecoveryRate();
    updateSystemHealth();

    return {
      success: false,
      strategy: 'all-failed',
      message: '所有恢复策略都失败了',
      nextAction: 'escalate'
    };
  };

  // 获取错误类型
  const getErrorType = (error: Error): ErrorType => {
    const message = error.message.toLowerCase();
    if (message.includes('network')) return ErrorType.NETWORK;
    if (message.includes('data') || message.includes('json')) return ErrorType.DATA;
    if (message.includes('render') || message.includes('component')) return ErrorType.UI;
    if (message.includes('system') || message.includes('memory')) return ErrorType.SYSTEM;
    return ErrorType.UNKNOWN;
  };

  // 获取错误严重程度
  const getErrorSeverity = (error: Error): ErrorSeverity => {
    const message = error.message.toLowerCase();
    if (message.includes('critical') || message.includes('fatal')) return ErrorSeverity.FATAL;
    if (message.includes('memory') || message.includes('system')) return ErrorSeverity.ERROR;
    if (message.includes('network') || message.includes('timeout')) return ErrorSeverity.WARNING;
    return ErrorSeverity.ERROR;
  };

  // 更新错误统计
  const updateErrorStats = (error: Error): void => {
    errorStats.totalErrors++;
    errorStats.lastErrorTime = Date.now();

    const errorType = getErrorType(error).toString();
    errorStats.commonErrorTypes[errorType] = (errorStats.commonErrorTypes[errorType] || 0) + 1;

    if (getErrorSeverity(error) === ErrorSeverity.FATAL) {
      errorStats.criticalErrors++;
    }
  };

  // 更新恢复率
  const updateRecoveryRate = (): void => {
    if (errorStats.totalErrors > 0) {
      errorStats.recoveryRate = (errorStats.recoveredErrors / errorStats.totalErrors) * 100;
    }
  };

  // 添加到错误历史
  const addToErrorHistory = (errorInfo: ErrorInfo): void => {
    errorHistory.value.unshift(errorInfo);
    if (errorHistory.value.length > maxHistorySize) {
      errorHistory.value = errorHistory.value.slice(0, maxHistorySize);
    }
  };

  // 更新系统健康状态
  const updateSystemHealth = (): void => {
    const now = Date.now();
    const recentErrors = errorHistory.value.filter(e =>
      (now - new Date(e.timestamp).getTime()) < 300000 // 最近5分钟
    );

    let score = 100;
    let status: SystemHealth['status'] = 'healthy';
    const issues: SystemHealth['issues'] = [];
    const recommendations: string[] = [];

    // 根据错误数量降低分数
    if (recentErrors.length > 10) {
      score -= 40;
      status = 'critical';
      issues.push({
        type: 'high-error-rate',
        severity: 'critical',
        message: `最近5分钟内发生${recentErrors.length}个错误`,
        timestamp: now
      });
      recommendations.push('系统错误频率过高，建议重启应用');
    } else if (recentErrors.length > 5) {
      score -= 20;
      status = 'degraded';
      issues.push({
        type: 'moderate-error-rate',
        severity: 'high',
        message: `最近5分钟内发生${recentErrors.length}个错误`,
        timestamp: now
      });
      recommendations.push('错误率较高，建议检查网络连接');
    }

    // 根据恢复率调整分数
    if (errorStats.recoveryRate < 50 && errorStats.totalErrors > 5) {
      score -= 30;
      status = status === 'healthy' ? 'degraded' : status;
      issues.push({
        type: 'low-recovery-rate',
        severity: 'high',
        message: `错误恢复率仅为${errorStats.recoveryRate.toFixed(1)}%`,
        timestamp: now
      });
      recommendations.push('错误恢复率较低，建议更新应用');
    }

    // 检查关键错误
    if (errorStats.criticalErrors > 0) {
      score -= 25;
      status = 'critical';
      issues.push({
        type: 'critical-errors',
        severity: 'critical',
        message: `检测到${errorStats.criticalErrors}个严重错误`,
        timestamp: now
      });
      recommendations.push('存在严重错误，需要立即处理');
    }

    // 检查活跃恢复任务
    if (activeRecoveries.value.size > 3) {
      score -= 15;
      status = status === 'healthy' ? 'recovering' : status;
      issues.push({
        type: 'multiple-recoveries',
        severity: 'medium',
        message: `正在执行${activeRecoveries.value.size}个恢复任务`,
        timestamp: now
      });
    }

    systemHealth.status = status;
    systemHealth.score = Math.max(0, score);
    systemHealth.issues = issues;
    systemHealth.recommendations = recommendations;

    logger.info(`系统健康状态更新: ${status} (${systemHealth.score}/100)`);
  };

  // 获取恢复建议
  const getRecoveryRecommendations = (error: Error): string[] => {
    const recommendations: string[] = [];
    const message = error.message.toLowerCase();

    if (message.includes('network')) {
      recommendations.push('检查网络连接');
      recommendations.push('尝试刷新页面');
      recommendations.push('等待网络恢复后重试');
    }

    if (message.includes('memory')) {
      recommendations.push('关闭其他应用程序');
      recommendations.push('清理浏览器缓存');
      recommendations.push('重启浏览器');
    }

    if (message.includes('render') || message.includes('component')) {
      recommendations.push('重新加载组件');
      recommendations.push('清除本地存储数据');
      recommendations.push('更新浏览器版本');
    }

    return recommendations;
  };

  // 清理过期的错误历史
  const cleanupErrorHistory = (): void => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时

    errorHistory.value = errorHistory.value.filter(error =>
      (now - new Date(error.timestamp).getTime()) < maxAge
    );
  };

  // 导出错误报告
  const exportErrorReport = (): string => {
    const report = {
      timestamp: new Date().toISOString(),
      systemHealth: systemHealth,
      errorStats: errorStats,
      recentErrors: errorHistory.value.slice(0, 20),
      activeRecoveries: Array.from(activeRecoveries.value.entries()).map(([id, recovery]) => ({
        id,
        strategy: recovery.strategy,
        startTime: recovery.startTime,
        duration: Date.now() - recovery.startTime,
        error: recovery.error.message
      })),
      strategies: Array.from(strategies.keys())
    };

    return JSON.stringify(report, null, 2);
  };

  // 定期维护任务
  let maintenanceInterval: NodeJS.Timeout;

  onMounted(() => {
    // 注册默认策略
    registerDefaultStrategies();

    // 初始化系统健康状态
    updateSystemHealth();

    // 设置定期维护
    maintenanceInterval = setInterval(() => {
      cleanupErrorHistory();
      updateSystemHealth();
    }, 5 * 60 * 1000); // 每5分钟

    logger.info('错误恢复系统已初始化');
  });

  onBeforeUnmount(() => {
    if (maintenanceInterval) {
      clearInterval(maintenanceInterval);
    }
  });

  return {
    // 策略管理
    registerStrategy,
    unregisterStrategy,
    strategies: computed(() => Array.from(strategies.values())),

    // 错误恢复
    recoverFromError,
    getRecoveryRecommendations,

    // 状态查询
    systemHealth: readonly(systemHealth),
    errorStats: readonly(errorStats),
    errorHistory: readonly(errorHistory),
    activeRecoveries: readonly(activeRecoveries),

    // 工具方法
    cleanupErrorHistory,
    exportErrorReport
  };
}
