<template>
  <div>
    <slot v-if="!hasError"></slot>
    <div v-else class="error-boundary">
      <h3>{{ $t('system.componentError') }}</h3>
      <p>{{ errorMessage }}</p>
      <button @click="resetError" class="retry-button">{{ $t('system.retry') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { handleError, ErrorType } from '../../../infrastructure/utils/errorHandler';

// ==================== 类型定义 ====================

/**
 * ErrorBoundary Props接口
 */
interface Props {
  componentId?: string;
}

// ==================== Props ====================

const props = withDefaults(defineProps<Props>(), {
  componentId: 'unknown'
});

// ==================== 响应式状态 ====================

/**
 * 是否发生错误
 */
const hasError = ref(false);

/**
 * 错误信息
 */
const errorMessage = ref('');

/**
 * 错误详情
 */
const errorDetails = ref<Error | null>(null);

// ==================== 方法 ====================

/**
 * 重置错误状态
 */
const resetError = (): void => {
  hasError.value = false;
  errorMessage.value = '';
  errorDetails.value = null;
};

// ==================== 错误处理 ====================

/**
 * Vue 3 Composition API 错误捕获钩子
 */
onErrorCaptured((err: Error, instance, info: string) => {
  hasError.value = true;
  errorMessage.value = err.message || '组件渲染错误';
  errorDetails.value = err;

  // 使用统一的错误处理
  handleError(
    err,
    `Component: ${props.componentId || (instance as any)?.$options?.name || 'Unknown'}`,
    ErrorType.SYSTEM
  );

  // 返回false阻止错误继续传播
  return false;
});
</script>

<style scoped>
.error-boundary {
  padding: 16px;
  margin: 8px 0;
  border: 1px solid #f56c6c;
  border-radius: 4px;
  background-color: #fef0f0;
  color: #f56c6c;
  text-align: center;
}

.retry-button {
  margin-top: 12px;
  padding: 6px 12px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #e74c3c;
}

.retry-button:active {
  transform: translateY(1px);
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .error-boundary {
    background-color: #4a1d1d;
    border-color: #e74c3c;
    color: #ff6b6b;
  }

  .retry-button {
    background-color: #e74c3c;
  }

  .retry-button:hover {
    background-color: #c0392b;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-boundary {
    padding: 12px;
    margin: 6px 0;
  }

  .retry-button {
    width: 100%;
    padding: 10px;
  }
}
</style>
