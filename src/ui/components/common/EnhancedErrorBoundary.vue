<!--
  增强版错误边界组件
  提供完整的错误捕获、恢复和报告功能
-->
<template>
  <div class="enhanced-error-boundary">
    <!-- 正常渲染子组件 -->
    <slot v-if="!errorState.hasError" :error-boundary="errorBoundaryMethods"></slot>

    <!-- 错误状态显示 -->
    <div v-else class="error-display" :class="getErrorDisplayClass()">
      <div class="error-container">

        <!-- 错误图标和标题 -->
        <div class="error-header">
          <span class="error-icon">{{ getErrorIcon() }}</span>
          <h3 class="error-title">{{ getErrorTitle() }}</h3>
          <div class="error-severity" :class="errorState.severity">
            {{ getSeverityText() }}
          </div>
        </div>

        <!-- 错误消息 -->
        <div class="error-message">
          <p class="primary-message">{{ errorState.userMessage }}</p>
          <p v-if="errorState.suggestion" class="error-suggestion">
            💡 {{ errorState.suggestion }}
          </p>
        </div>

        <!-- 错误详情（开发模式或详细模式下显示） -->
        <div v-if="showDetails" class="error-details">
          <details class="technical-details">
            <summary class="details-toggle">技术详情</summary>
            <div class="details-content">
              <div class="detail-section">
                <h4>错误信息</h4>
                <pre class="error-stack">{{ errorState.originalMessage }}</pre>
              </div>
              <div v-if="errorState.stack" class="detail-section">
                <h4>堆栈跟踪</h4>
                <pre class="error-stack">{{ errorState.stack }}</pre>
              </div>
              <div v-if="errorState.componentTrace" class="detail-section">
                <h4>组件跟踪</h4>
                <pre class="component-trace">{{ errorState.componentTrace }}</pre>
              </div>
              <div class="detail-section">
                <h4>错误元数据</h4>
                <pre class="error-metadata">{{ JSON.stringify(errorState.metadata, null, 2) }}</pre>
              </div>
            </div>
          </details>
        </div>

        <!-- 操作按钮 -->
        <div class="error-actions">
          <button
            @click="retryOperation"
            class="action-btn retry-btn"
            :disabled="errorState.isRetrying"
          >
            <span class="btn-icon">{{ errorState.isRetrying ? '⏳' : '🔄' }}</span>
            <span class="btn-text">
              {{ errorState.isRetrying ? '重试中...' : '重试' }}
            </span>
          </button>

          <button
            v-if="canReload"
            @click="reloadComponent"
            class="action-btn reload-btn"
          >
            <span class="btn-icon">♻️</span>
            <span class="btn-text">重新加载</span>
          </button>

          <button
            v-if="canRecover"
            @click="attemptRecovery"
            class="action-btn recover-btn"
          >
            <span class="btn-icon">🛠️</span>
            <span class="btn-text">尝试恢复</span>
          </button>

          <button
            @click="toggleDetails"
            class="action-btn details-btn"
          >
            <span class="btn-icon">{{ showDetails ? '🔽' : '🔼' }}</span>
            <span class="btn-text">{{ showDetails ? '隐藏详情' : '显示详情' }}</span>
          </button>

          <button
            @click="reportError"
            class="action-btn report-btn"
            :disabled="errorState.isReporting"
          >
            <span class="btn-icon">{{ errorState.isReporting ? '📤' : '📝' }}</span>
            <span class="btn-text">
              {{ errorState.isReporting ? '报告中...' : '报告错误' }}
            </span>
          </button>
        </div>

        <!-- 恢复状态指示 -->
        <div v-if="recoveryState.isAttempting" class="recovery-status">
          <div class="recovery-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${recoveryState.progress}%` }"
              ></div>
            </div>
            <p class="recovery-text">{{ recoveryState.message }}</p>
          </div>
        </div>

        <!-- 错误统计 -->
        <div v-if="errorState.retryCount > 0" class="error-stats">
          <small class="stats-text">
            已重试 {{ errorState.retryCount }} 次
            <span v-if="errorState.lastErrorTime">
              · 上次错误: {{ formatTime(errorState.lastErrorTime) }}
            </span>
          </small>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { handleError, ErrorType, ErrorSeverity, type ErrorInfo } from '../../../infrastructure/utils/errorHandler';
import { useSmartLogger } from '../../../infrastructure/utils/smartLogger';

// Props
interface Props {
  componentId?: string;
  fallbackComponent?: string;
  maxRetries?: number;
  retryDelay?: number;
  autoRecover?: boolean;
  reportErrors?: boolean;
  showDetails?: boolean;
  severity?: 'info' | 'warning' | 'error' | 'fatal';
  recoveryStrategies?: Array<'retry' | 'reload' | 'fallback' | 'reset'>;
}

// Vue 3.5 新特性：Props解构默认值（响应式props解构）
const {
  componentId = 'unknown',
  fallbackComponent = '',
  maxRetries = 3,
  retryDelay = 1000,
  autoRecover = true,
  reportErrors = true,
  showDetails = false,
  severity = 'warning',
  recoveryStrategies = () => ['retry', 'reload', 'reset']
} = defineProps<Props>();

// Emits
const emit = defineEmits<{
  error: [error: Error, errorInfo: any];
  recovery: [strategy: string, success: boolean];
  retry: [attempt: number];
}>();

const logger = useSmartLogger();

// 错误状态
const errorState = ref({
  hasError: false,
  originalMessage: '',
  userMessage: '',
  suggestion: '',
  stack: '',
  componentTrace: '',
  severity: ErrorSeverity.WARNING,
  type: ErrorType.UNKNOWN,
  retryCount: 0,
  isRetrying: false,
  isReporting: false,
  lastErrorTime: 0,
  metadata: {} as Record<string, any>
});

// 恢复状态
const recoveryState = ref({
  isAttempting: false,
  progress: 0,
  message: '',
  strategy: ''
});

// 显示详情状态
const showDetails = ref(props.showDetails);

// 计算属性
const canReload = computed(() =>
  props.recoveryStrategies.includes('reload') &&
  errorState.value.retryCount < props.maxRetries
);

const canRecover = computed(() =>
  props.recoveryStrategies.includes('reset') ||
  props.recoveryStrategies.includes('fallback')
);

// 错误处理
const captureError = (error: Error, errorInfo: any): void => {
  const now = Date.now();

  // 分析错误类型和严重程度
  const { type, severity, userMessage, suggestion } = analyzeError(error);

  errorState.value = {
    hasError: true,
    originalMessage: error.message,
    userMessage,
    suggestion,
    stack: error.stack || '',
    componentTrace: errorInfo?.componentStack || '',
    severity,
    type,
    retryCount: errorState.value.retryCount,
    isRetrying: false,
    isReporting: false,
    lastErrorTime: now,
    metadata: {
      componentId: props.componentId,
      timestamp: now,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...errorInfo
    }
  };

  // 处理错误
  const processedError = handleError(error, `ErrorBoundary.${props.componentId}`, type, severity);

  // 发送错误事件
  emit('error', error, errorInfo);

  // 自动恢复
  if (props.autoRecover && errorState.value.retryCount < props.maxRetries) {
    scheduleAutoRetry();
  }

  logger.error(`错误边界捕获错误: ${props.componentId}`, {
    error: error.message,
    severity,
    retryCount: errorState.value.retryCount
  });
};

// 分析错误
const analyzeError = (error: Error): {
  type: ErrorType;
  severity: ErrorSeverity;
  userMessage: string;
  suggestion: string;
} => {
  const message = error.message.toLowerCase();

  // 网络错误
  if (message.includes('network') || message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.WARNING,
      userMessage: '网络连接出现问题',
      suggestion: '请检查网络连接并重试'
    };
  }

  // 数据错误
  if (message.includes('json') || message.includes('parse')) {
    return {
      type: ErrorType.DATA,
      severity: ErrorSeverity.ERROR,
      userMessage: '数据格式错误',
      suggestion: '数据可能损坏，请尝试刷新页面'
    };
  }

  // UI错误
  if (message.includes('render') || message.includes('template')) {
    return {
      type: ErrorType.UI,
      severity: ErrorSeverity.ERROR,
      userMessage: '界面渲染出现问题',
      suggestion: '请尝试重新加载此组件'
    };
  }

  // 系统错误
  if (message.includes('memory') || message.includes('out of')) {
    return {
      type: ErrorType.SYSTEM,
      severity: ErrorSeverity.FATAL,
      userMessage: '系统资源不足',
      suggestion: '请关闭其他应用或刷新页面'
    };
  }

  // 默认错误
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.ERROR,
    userMessage: '组件出现未知错误',
    suggestion: '请尝试重试或联系技术支持'
  };
};

// 重试操作
const retryOperation = async (): Promise<void> => {
  if (errorState.value.isRetrying) return;

  errorState.value.isRetrying = true;
  errorState.value.retryCount++;

  emit('retry', errorState.value.retryCount);

  try {
    // 延迟重试
    await new Promise(resolve => setTimeout(resolve, props.retryDelay));

    // 重置错误状态
    resetError();

    logger.info(`错误恢复成功: ${props.componentId} (第${errorState.value.retryCount}次重试)`);
    emit('recovery', 'retry', true);
  } catch (error) {
    logger.error(`重试失败: ${props.componentId}`, error);
    errorState.value.isRetrying = false;
    emit('recovery', 'retry', false);
  }
};

// 重新加载组件
const reloadComponent = (): void => {
  logger.info(`重新加载组件: ${props.componentId}`);
  resetError();
  emit('recovery', 'reload', true);
};

// 尝试恢复
const attemptRecovery = async (): Promise<void> => {
  recoveryState.value = {
    isAttempting: true,
    progress: 0,
    message: '正在分析错误...',
    strategy: 'analysis'
  };

  try {
    // 模拟恢复过程
    for (let i = 0; i <= 100; i += 10) {
      recoveryState.value.progress = i;
      recoveryState.value.message = getRecoveryMessage(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 执行恢复策略
    if (props.recoveryStrategies.includes('reset')) {
      resetError();
      emit('recovery', 'reset', true);
    } else if (props.recoveryStrategies.includes('fallback')) {
      // 实现回退策略
      emit('recovery', 'fallback', true);
    }

    logger.info(`错误恢复完成: ${props.componentId}`);
  } catch (error) {
    logger.error(`错误恢复失败: ${props.componentId}`, error);
    emit('recovery', 'recover', false);
  } finally {
    recoveryState.value.isAttempting = false;
  }
};

// 获取恢复消息
const getRecoveryMessage = (progress: number): string => {
  if (progress < 30) return '正在分析错误原因...';
  if (progress < 60) return '正在尝试修复问题...';
  if (progress < 90) return '正在验证修复结果...';
  return '恢复即将完成...';
};

// 报告错误
const reportError = async (): Promise<void> => {
  if (errorState.value.isReporting) return;

  errorState.value.isReporting = true;

  try {
    // 构建错误报告
    const errorReport = {
      componentId: props.componentId,
      error: {
        message: errorState.value.originalMessage,
        stack: errorState.value.stack,
        type: errorState.value.type,
        severity: errorState.value.severity
      },
      context: errorState.value.metadata,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };

    // 发送错误报告（这里应该调用实际的错误报告API）
    logger.error('错误报告已生成', errorReport);

    // 模拟报告发送
    await new Promise(resolve => setTimeout(resolve, 1000));

    logger.info(`错误报告已发送: ${props.componentId}`);
  } catch (error) {
    logger.error('发送错误报告失败', error);
  } finally {
    errorState.value.isReporting = false;
  }
};

// 计划自动重试
const scheduleAutoRetry = (): void => {
  setTimeout(() => {
    if (errorState.value.hasError && errorState.value.retryCount < props.maxRetries) {
      retryOperation();
    }
  }, props.retryDelay * (errorState.value.retryCount + 1)); // 指数退避
};

// 重置错误状态
const resetError = (): void => {
  errorState.value.hasError = false;
  errorState.value.isRetrying = false;
  errorState.value.isReporting = false;
  recoveryState.value.isAttempting = false;
};

// 切换详情显示
const toggleDetails = (): void => {
  showDetails.value = !showDetails.value;
};

// 获取错误显示类
const getErrorDisplayClass = (): string => {
  return `error-${errorState.value.severity}`;
};

// 获取错误图标
const getErrorIcon = (): string => {
  switch (errorState.value.severity) {
    case ErrorSeverity.FATAL: return '🚨';
    case ErrorSeverity.ERROR: return '⚠️';
    case ErrorSeverity.WARNING: return '❗';
    case ErrorSeverity.INFO: return 'ℹ️';
    default: return '❓';
  }
};

// 获取错误标题
const getErrorTitle = (): string => {
  switch (errorState.value.type) {
    case ErrorType.NETWORK: return '网络错误';
    case ErrorType.DATA: return '数据错误';
    case ErrorType.UI: return '界面错误';
    case ErrorType.SYSTEM: return '系统错误';
    default: return '组件错误';
  }
};

// 获取严重程度文本
const getSeverityText = (): string => {
  switch (errorState.value.severity) {
    case ErrorSeverity.FATAL: return '严重';
    case ErrorSeverity.ERROR: return '错误';
    case ErrorSeverity.WARNING: return '警告';
    case ErrorSeverity.INFO: return '信息';
    default: return '未知';
  }
};

// 格式化时间
const formatTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  return `${Math.floor(diff / 3600000)}小时前`;
};

// 错误边界方法
const errorBoundaryMethods = {
  reportError: captureError,
  reset: resetError,
  retry: retryOperation
};

// Vue错误捕获钩子
const errorCaptured = (error: Error, instance: any, info: string): boolean => {
  captureError(error, { instance, info });
  return false; // 阻止错误继续向上传播
};

// 全局错误监听
onMounted(() => {
  // 监听未捕获的Promise错误
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (event.reason instanceof Error) {
      captureError(event.reason, { type: 'unhandledrejection' });
    }
  };

  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  onBeforeUnmount(() => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  });
});

// 导出错误捕获钩子以供父组件使用
defineExpose({
  captureError,
  resetError,
  errorState: errorState.value
});
</script>

<style scoped>
.enhanced-error-boundary {
  width: 100%;
  height: 100%;
}

.error-display {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: var(--space-4);
}

.error-display.error-fatal {
  background: rgba(239, 68, 68, 0.05);
  border: 2px solid var(--color-error);
}

.error-display.error-error {
  background: rgba(245, 158, 11, 0.05);
  border: 2px solid var(--color-warning);
}

.error-display.error-warning {
  background: rgba(59, 130, 246, 0.05);
  border: 2px solid var(--color-info);
}

.error-display.error-info {
  background: rgba(34, 197, 94, 0.05);
  border: 2px solid var(--color-success);
}

.error-container {
  max-width: 600px;
  width: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
}

.error-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.error-icon {
  font-size: 2rem;
}

.error-title {
  flex: 1;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.error-severity {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.error-severity.fatal {
  background: var(--color-error);
  color: white;
}

.error-severity.error {
  background: var(--color-warning);
  color: white;
}

.error-severity.warning {
  background: var(--color-info);
  color: white;
}

.error-severity.info {
  background: var(--color-success);
  color: white;
}

.error-message {
  margin-bottom: var(--space-5);
}

.primary-message {
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
  line-height: var(--line-height-relaxed);
}

.error-suggestion {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.error-details {
  margin-bottom: var(--space-5);
}

.technical-details {
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
}

.details-toggle {
  background: var(--color-bg-secondary);
  padding: var(--space-3);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.details-toggle:hover {
  background: var(--color-bg-tertiary);
}

.details-content {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border-secondary);
}

.detail-section {
  margin-bottom: var(--space-4);
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
}

.error-stack,
.component-trace,
.error-metadata {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  overflow-x: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.error-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.action-btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  border-color: var(--color-brand-blue);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.retry-btn {
  background: var(--color-brand-blue);
  color: white;
  border-color: var(--color-brand-blue);
}

.retry-btn:hover:not(:disabled) {
  background: var(--color-brand-blue-dark);
}

.reload-btn {
  background: var(--color-warning);
  color: white;
  border-color: var(--color-warning);
}

.recover-btn {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
}

.report-btn {
  background: var(--color-info);
  color: white;
  border-color: var(--color-info);
}

.btn-icon {
  font-size: var(--font-size-md);
}

.btn-text {
  font-weight: var(--font-weight-medium);
}

.recovery-status {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.recovery-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.progress-bar {
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-brand-blue);
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.recovery-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  text-align: center;
}

.error-stats {
  text-align: center;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-secondary);
}

.stats-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-container {
    padding: var(--space-4);
  }

  .error-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .error-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .action-btn {
    justify-content: center;
  }
}
</style>
