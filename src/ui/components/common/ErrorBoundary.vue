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

<script>
import { ref } from 'vue';
import { handleError, ErrorType } from '@/infrastructure/utils/errorHandler';

export default {
  name: 'ErrorBoundary',
  props: {
    // 组件标识，用于错误日志
    componentId: {
      type: String,
      default: 'unknown'
    }
  },
  
  setup(props) {
    const hasError = ref(false);
    const errorMessage = ref('');
    const errorDetails = ref(null);
    
    // 重置错误状态
    function resetError() {
      hasError.value = false;
      errorMessage.value = '';
      errorDetails.value = null;
    }
    
    return {
      hasError,
      errorMessage,
      errorDetails,
      resetError
    };
  },
  
  // Vue的错误处理钩子
  errorCaptured(err, instance, info) {
    this.hasError = true;
    this.errorMessage = err.message || '组件渲染错误';
    this.errorDetails = err;
    
    // 使用统一的错误处理
    handleError(
      err, 
      `Component: ${this.componentId || instance?.$options?.name || 'Unknown'}`, 
      ErrorType.SYSTEM
    );
    
    // 返回false阻止错误继续传播
    return false;
  }
};
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
}

.retry-button:hover {
  background-color: #e74c3c;
}
</style> 