<!--
  增强版错误边界组件
  提供完善的错误捕获、恢复和用户反馈机制
-->
<template>
  <div class="enhanced-error-boundary">
    <!-- 正常状态 -->
    <div v-if="!hasError" class="normal-content">
      <slot />
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <!-- 错误头部 -->
      <div class="error-header">
        <div class="error-icon">
          <svg v-if="errorSeverity === 'fatal'" class="fatal-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.58L19 8l-9 9z"/>
          </svg>
          <svg v-else-if="errorSeverity === 'error'" class="error-icon-svg" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.58L19 8l-9 9z"/>
          </svg>
          <svg v-else class="warning-icon" viewBox="0 0 24 24">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>
        
        <div class="error-title">
          <h2>{{ errorTitle }}</h2>
          <p class="error-subtitle">{{ errorSubtitle }}</p>
        </div>
      </div>

      <!-- 错误详情 -->
      <div class="error-details">
        <div class="error-message">
          <h3>错误信息</h3>
          <p>{{ errorMessage }}</p>
        </div>

        <!-- 恢复建议 -->
        <div v-if="recoverySuggestions.length > 0" class="recovery-suggestions">
          <h3>建议的解决方案</h3>
          <ul>
            <li v-for="(suggestion, index) in recoverySuggestions" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </div>

        <!-- 错误详细信息（可展开） -->
        <div class="error-technical-details">
          <button 
            @click="showTechnicalDetails = !showTechnicalDetails"
            class="toggle-details-btn"
          >
            {{ showTechnicalDetails ? '隐藏' : '显示' }}技术详情
            <span :class="['chevron', { 'chevron-up': showTechnicalDetails }]">▼</span>
          </button>
          
          <div v-if="showTechnicalDetails" class="technical-details">
            <div class="detail-item">
              <strong>错误类型:</strong> {{ errorInfo?.type || 'unknown' }}
            </div>
            <div class="detail-item">
              <strong>严重程度:</strong> {{ errorInfo?.severity || 'unknown' }}
            </div>
            <div class="detail-item">
              <strong>发生时间:</strong> {{ formatTimestamp(errorInfo?.timestamp) }}
            </div>
            <div class="detail-item">
              <strong>组件:</strong> {{ errorInfo?.context || 'unknown' }}
            </div>
            <div v-if="errorInfo?.stack" class="detail-item">
              <strong>调用栈:</strong>
              <pre class="stack-trace">{{ errorInfo.stack }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="error-actions">
        <div class="primary-actions">
          <button 
            @click="attemptRecovery"
            :disabled="isRecovering"
            class="btn btn-primary recovery-btn"
          >
            <span v-if="isRecovering" class="spinner"></span>
            {{ isRecovering ? '恢复中...' : '尝试恢复' }}
          </button>
          
          <button 
            @click="reload"
            class="btn btn-secondary reload-btn"
          >
            🔄 重新加载
          </button>
        </div>

        <div class="secondary-actions">
          <button 
            @click="reportError"
            :disabled="isReporting"
            class="btn btn-outline report-btn"
          >
            {{ isReporting ? '发送中...' : '📋 报告问题' }}
          </button>
          
          <button 
            @click="copyErrorInfo"
            class="btn btn-outline copy-btn"
          >
            📋 复制错误信息
          </button>
          
          <button 
            v-if="canGoBack"
            @click="goBack"
            class="btn btn-outline back-btn"
          >
            ← 返回上页
          </button>
        </div>
      </div>

      <!-- 恢复进度 -->
      <div v-if="recoveryProgress" class="recovery-progress">
        <div class="progress-header">
          <span>{{ recoveryProgress.message }}</span>
          <span class="progress-percentage">{{ recoveryProgress.percentage }}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${recoveryProgress.percentage}%` }"
          ></div>
        </div>
      </div>

      <!-- 恢复结果 -->
      <div v-if="recoveryResult" class="recovery-result">
        <div :class="['result-message', recoveryResult.success ? 'success' : 'failure']">
          <span class="result-icon">
            {{ recoveryResult.success ? '✅' : '❌' }}
          </span>
          <span>{{ recoveryResult.message }}</span>
        </div>
        
        <div v-if="!recoveryResult.success && recoveryResult.shouldRetry" class="retry-info">
          <p>{{ retryCountdown > 0 ? `${retryCountdown}秒后自动重试` : '准备重试...' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured, onMounted, onUnmounted, nextTick } from 'vue';
import { getGlobalErrorHandler, type ErrorRecoveryStrategy, type RecoveryResult } from '../../infrastructure/utils/enhancedErrorHandler';
import type { ErrorInfo, ErrorSeverity } from '../../infrastructure/utils/errorTypes';

// Props
interface Props {
  /** 是否显示技术详情 */
  showTechnicalInfo?: boolean;
  /** 自定义恢复策略 */
  customRecoveryStrategies?: ErrorRecoveryStrategy[];
  /** 是否自动尝试恢复 */
  autoRecover?: boolean;
  /** 错误报告回调 */
  onErrorReport?: (errorInfo: ErrorInfo) => Promise<void>;
  /** 恢复成功回调 */
  onRecoverySuccess?: () => void;
  /** 恢复失败回调 */
  onRecoveryFailure?: (result: RecoveryResult) => void;
}

const props = withDefaults(defineProps<Props>(), {
  showTechnicalInfo: false,
  autoRecover: true
});

// Emits
const emit = defineEmits<{
  error: [errorInfo: ErrorInfo];
  recovery: [result: RecoveryResult];
  reset: [];
}>();

// 状态
const hasError = ref(false);
const errorInfo = ref<ErrorInfo | null>(null);
const isRecovering = ref(false);
const isReporting = ref(false);
const showTechnicalDetails = ref(false);
const recoveryResult = ref<RecoveryResult | null>(null);
const recoveryProgress = ref<{ message: string; percentage: number } | null>(null);
const retryCountdown = ref(0);
const retryTimer = ref<number | null>(null);

// 错误处理器
const errorHandler = getGlobalErrorHandler();

// 计算属性
const errorSeverity = computed(() => errorInfo.value?.severity || 'error');

const errorTitle = computed(() => {
  const severity = errorSeverity.value;
  switch (severity) {
    case 'fatal':
      return '系统发生严重错误';
    case 'error':
      return '发生错误';
    case 'warning':
      return '检测到异常';
    default:
      return '出现问题';
  }
});

const errorSubtitle = computed(() => {
  const severity = errorSeverity.value;
  switch (severity) {
    case 'fatal':
      return '应用程序遇到了无法恢复的错误';
    case 'error':
      return '应用程序遇到了一个错误，正在尝试恢复';
    case 'warning':
      return '检测到可能的问题，但应用程序仍在运行';
    default:
      return '请稍等，我们正在处理这个问题';
  }
});

const errorMessage = computed(() => {
  if (!errorInfo.value) return '未知错误';
  
  // 提供用户友好的错误消息
  const message = errorInfo.value.message;
  
  // 根据错误类型提供更友好的消息
  if (message.includes('NetworkError') || message.includes('fetch')) {
    return '网络连接出现问题，请检查您的网络设置';
  }
  
  if (message.includes('localStorage') || message.includes('storage')) {
    return '本地存储出现问题，可能需要清理浏览器缓存';
  }
  
  if (message.includes('permission')) {
    return '权限不足，请确认您有相应的操作权限';
  }
  
  return message;
});

const recoverySuggestions = computed(() => {
  if (!errorInfo.value) return [];
  
  const suggestions: string[] = [];
  const type = errorInfo.value.type;
  const message = errorInfo.value.message.toLowerCase();
  
  switch (type) {
    case 'network':
      suggestions.push('检查网络连接是否正常');
      suggestions.push('尝试刷新页面');
      if (message.includes('timeout')) {
        suggestions.push('网络可能较慢，请稍后重试');
      }
      break;
      
    case 'storage':
      suggestions.push('清理浏览器缓存和本地存储');
      suggestions.push('确保有足够的存储空间');
      suggestions.push('检查是否在隐私模式下浏览');
      break;
      
    case 'validation':
      suggestions.push('检查输入的数据是否正确');
      suggestions.push('确认所有必填字段都已填写');
      break;
      
    case 'ui':
      suggestions.push('尝试刷新当前页面');
      suggestions.push('关闭其他标签页释放内存');
      break;
      
    default:
      suggestions.push('尝试刷新页面');
      suggestions.push('如果问题持续存在，请联系技术支持');
  }
  
  return suggestions;
});

const canGoBack = computed(() => {
  return window.history.length > 1;
});

// 错误捕获
onErrorCaptured((error: Error, instance, info) => {
  handleError(error, {
    component: instance?.$options?.name || 'unknown',
    action: 'vue-error-boundary',
    vueErrorInfo: info
  });
  
  return false; // 阻止错误向上传播
});

// 方法
const handleError = async (error: Error, context?: any) => {
  hasError.value = true;
  
  try {
    const result = await errorHandler.handleError(error, context);
    
    errorInfo.value = {
      id: `err_${Date.now()}`,
      message: error.message,
      type: (error as any).type || 'unknown',
      severity: (error as any).severity || 'error',
      context: context?.component || 'unknown',
      timestamp: new Date().toISOString(),
      stack: error.stack,
      metadata: context || {},
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    emit('error', errorInfo.value);
    
    // 自动恢复
    if (props.autoRecover) {
      await nextTick();
      attemptRecovery();
    }
  } catch (handlingError) {
    console.error('错误处理失败:', handlingError);
    
    // 创建基本错误信息
    errorInfo.value = {
      id: `err_${Date.now()}`,
      message: error.message,
      type: 'unknown',
      severity: 'error',
      context: 'error-boundary',
      timestamp: new Date().toISOString(),
      stack: error.stack,
      metadata: {},
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }
};

const attemptRecovery = async () => {
  if (!errorInfo.value || isRecovering.value) return;
  
  isRecovering.value = true;
  recoveryResult.value = null;
  recoveryProgress.value = { message: '开始恢复...', percentage: 0 };
  
  try {
    // 模拟恢复进度
    const progressSteps = [
      { message: '分析错误...', percentage: 20 },
      { message: '查找恢复策略...', percentage: 40 },
      { message: '执行恢复操作...', percentage: 60 },
      { message: '验证恢复结果...', percentage: 80 },
      { message: '完成恢复...', percentage: 100 }
    ];
    
    for (const step of progressSteps) {
      recoveryProgress.value = step;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 实际恢复操作
    const result = await errorHandler.handleError(new Error(errorInfo.value.message));
    
    recoveryResult.value = result;
    emit('recovery', result);
    
    if (result.success) {
      props.onRecoverySuccess?.();
      
      // 恢复成功，重置错误状态
      setTimeout(() => {
        resetError();
      }, 2000);
    } else {
      props.onRecoveryFailure?.(result);
      
      // 如果建议重试，设置倒计时
      if (result.shouldRetry && result.retryAfter) {
        startRetryCountdown(result.retryAfter);
      }
    }
  } catch (recoveryError) {
    console.error('恢复操作失败:', recoveryError);
    recoveryResult.value = {
      success: false,
      message: '恢复操作执行失败'
    };
  } finally {
    isRecovering.value = false;
    recoveryProgress.value = null;
  }
};

const resetError = () => {
  hasError.value = false;
  errorInfo.value = null;
  recoveryResult.value = null;
  isRecovering.value = false;
  isReporting.value = false;
  showTechnicalDetails.value = false;
  
  clearRetryTimer();
  emit('reset');
};

const reload = () => {
  window.location.reload();
};

const reportError = async () => {
  if (!errorInfo.value || isReporting.value) return;
  
  isReporting.value = true;
  
  try {
    if (props.onErrorReport) {
      await props.onErrorReport(errorInfo.value);
    } else {
      // 默认报告行为
      const report = errorHandler.exportErrorReport();
      console.log('错误报告:', report);
      
      // 这里可以实现发送到服务器的逻辑
      // await sendErrorReport(report);
    }
    
    alert('错误报告已发送，感谢您的反馈！');
  } catch (reportingError) {
    console.error('发送错误报告失败:', reportingError);
    alert('发送错误报告失败，请稍后重试');
  } finally {
    isReporting.value = false;
  }
};

const copyErrorInfo = async () => {
  if (!errorInfo.value) return;
  
  const errorText = JSON.stringify(errorInfo.value, null, 2);
  
  try {
    await navigator.clipboard.writeText(errorText);
    alert('错误信息已复制到剪贴板');
  } catch (copyError) {
    console.error('复制失败:', copyError);
    
    // 降级方案：选中文本
    const textArea = document.createElement('textarea');
    textArea.value = errorText;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      alert('错误信息已复制到剪贴板');
    } catch (execError) {
      alert('复制失败，请手动复制错误信息');
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

const goBack = () => {
  window.history.back();
};

const startRetryCountdown = (retryAfter: number) => {
  retryCountdown.value = Math.ceil(retryAfter / 1000);
  
  retryTimer.value = window.setInterval(() => {
    retryCountdown.value--;
    
    if (retryCountdown.value <= 0) {
      clearRetryTimer();
      attemptRecovery();
    }
  }, 1000);
};

const clearRetryTimer = () => {
  if (retryTimer.value) {
    clearInterval(retryTimer.value);
    retryTimer.value = null;
  }
  retryCountdown.value = 0;
};

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return '未知';
  return new Date(timestamp).toLocaleString();
};

// 生命周期
onMounted(() => {
  // 注册自定义恢复策略
  if (props.customRecoveryStrategies) {
    props.customRecoveryStrategies.forEach(strategy => {
      errorHandler.registerRecoveryStrategy(strategy);
    });
  }
});

onUnmounted(() => {
  clearRetryTimer();
});

// 暴露方法
defineExpose({
  resetError,
  handleError
});
</script>

<style scoped>
.enhanced-error-boundary {
  width: 100%;
  height: 100%;
}

.normal-content {
  width: 100%;
  height: 100%;
}

.error-state {
  min-height: 400px;
  padding: 24px;
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;
}

.error-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #feb2b2;
}

.error-icon {
  width: 48px;
  height: 48px;
  margin-right: 16px;
  flex-shrink: 0;
}

.fatal-icon {
  fill: #e53e3e;
}

.error-icon-svg {
  fill: #e53e3e;
}

.warning-icon {
  fill: #dd6b20;
}

.error-title h2 {
  margin: 0 0 4px;
  font-size: 24px;
  color: #2d3748;
}

.error-subtitle {
  margin: 0;
  color: #718096;
  font-size: 14px;
}

.error-details {
  margin-bottom: 24px;
}

.error-message {
  margin-bottom: 20px;
}

.error-message h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #2d3748;
}

.error-message p {
  margin: 0;
  color: #4a5568;
  line-height: 1.5;
}

.recovery-suggestions {
  margin-bottom: 20px;
}

.recovery-suggestions h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #2d3748;
}

.recovery-suggestions ul {
  margin: 0;
  padding-left: 20px;
  color: #4a5568;
}

.recovery-suggestions li {
  margin-bottom: 4px;
  line-height: 1.4;
}

.error-technical-details {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.toggle-details-btn {
  background: none;
  border: none;
  color: #3182ce;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  padding: 4px 0;
}

.toggle-details-btn:hover {
  color: #2c5aa0;
}

.chevron {
  transition: transform 0.2s;
  font-size: 12px;
}

.chevron-up {
  transform: rotate(180deg);
}

.technical-details {
  margin-top: 12px;
  padding: 16px;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.detail-item {
  margin-bottom: 8px;
  font-size: 14px;
  color: #4a5568;
}

.detail-item strong {
  color: #2d3748;
}

.stack-trace {
  background: #1a202c;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  margin-top: 8px;
}

.error-actions {
  margin-bottom: 20px;
}

.primary-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.secondary-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3182ce;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2c5aa0;
}

.btn-secondary {
  background: #718096;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4a5568;
}

.btn-outline {
  background: transparent;
  color: #3182ce;
  border: 1px solid #3182ce;
}

.btn-outline:hover:not(:disabled) {
  background: #3182ce;
  color: white;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.recovery-progress {
  margin-bottom: 16px;
  padding: 16px;
  background: #ebf8ff;
  border-radius: 8px;
  border: 1px solid #bee3f8;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #2c5aa0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #bee3f8;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3182ce;
  transition: width 0.3s ease;
}

.recovery-result {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.result-message {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  margin-bottom: 8px;
}

.result-message.success {
  color: #22543d;
  background: #f0fff4;
  border: 1px solid #9ae6b4;
}

.result-message.failure {
  color: #742a2a;
  background: #fff5f5;
  border: 1px solid #feb2b2;
}

.retry-info {
  font-size: 14px;
  color: #718096;
  font-style: italic;
}

.result-icon {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .error-state {
    padding: 16px;
    margin: 8px;
  }
  
  .error-header {
    flex-direction: column;
    text-align: center;
  }
  
  .error-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .primary-actions,
  .secondary-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>