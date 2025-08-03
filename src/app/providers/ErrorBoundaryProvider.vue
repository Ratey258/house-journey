<!--
  错误边界Provider
  捕获应用级别的错误
-->
<template>
  <div class="error-boundary-provider">
    <!-- 错误状态 -->
    <div v-if="hasError" class="error-boundary">
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">应用出现错误</h2>
        <p class="error-message">{{ errorMessage }}</p>
        
        <details v-if="errorDetails && isDev" class="error-details">
          <summary>错误详情</summary>
          <pre>{{ errorDetails }}</pre>
        </details>
        
        <div class="error-actions">
          <button @click="reload" class="error-button primary">
            刷新页面
          </button>
          <button @click="reset" class="error-button secondary">
            重置应用
          </button>
        </div>
        
        <div class="error-help">
          <p>如果问题持续存在，请尝试:</p>
          <ul>
            <li>清除浏览器缓存</li>
            <li>检查网络连接</li>
            <li>联系技术支持</li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- 正常内容 -->
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onErrorCaptured } from 'vue';

// 错误状态
const hasError = ref(false);
const errorMessage = ref('');
const errorDetails = ref('');
const isDev = import.meta.env.DEV;

// 捕获Vue组件错误
onErrorCaptured((error, instance, info) => {
  console.error('🚨 ErrorBoundary捕获到组件错误:', error);
  console.error('📍 错误实例:', instance);
  console.error('ℹ️ 错误信息:', info);
  
  hasError.value = true;
  errorMessage.value = error.message || '未知错误';
  errorDetails.value = `${error.stack}\n\n组件信息: ${info}`;
  
  // 上报错误 (生产环境)
  if (!isDev) {
    reportError('vue-component-error', error, { instance, info });
  }
  
  // 阻止错误继续传播
  return false;
});

// 捕获全局JavaScript错误
const setupGlobalErrorHandlers = () => {
  // 全局错误处理
  window.addEventListener('error', (event) => {
    console.error('🚨 全局错误:', event.error);
    
    if (!hasError.value) {
      hasError.value = true;
      errorMessage.value = event.error?.message || '全局JavaScript错误';
      errorDetails.value = event.error?.stack || '';
      
      if (!isDev) {
        reportError('global-error', event.error);
      }
    }
  });
  
  // 未捕获的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 未捕获的Promise拒绝:', event.reason);
    
    if (!hasError.value) {
      hasError.value = true;
      errorMessage.value = event.reason?.message || '未捕获的Promise拒绝';
      errorDetails.value = event.reason?.stack || '';
      
      if (!isDev) {
        reportError('unhandled-promise', event.reason);
      }
    }
    
    // 阻止默认行为
    event.preventDefault();
  });
};

// 错误上报 (简化版本)
const reportError = (type: string, error: Error, extra?: any) => {
  // 这里可以集成错误监控服务
  // 例如: Sentry, LogRocket, Bugsnag等
  console.log('📊 错误上报:', { type, error, extra });
};

// 刷新页面
const reload = () => {
  window.location.reload();
};

// 重置应用状态
const reset = () => {
  try {
    // 清除本地存储
    localStorage.clear();
    sessionStorage.clear();
    
    // 重新加载页面
    window.location.reload();
  } catch (error) {
    console.error('重置应用失败:', error);
    // 如果清除存储失败，直接刷新页面
    window.location.reload();
  }
};

// 生命周期
onMounted(() => {
  setupGlobalErrorHandlers();
  
  if (isDev) {
    console.log('🛡️ ErrorBoundaryProvider 已挂载');
  }
});

// 组件元信息
defineOptions({
  name: 'ErrorBoundaryProvider'
});
</script>

<style scoped>
.error-boundary-provider {
  width: 100%;
  height: 100%;
}

.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--color-bg-primary);
}

.error-container {
  max-width: 600px;
  width: 100%;
  text-align: center;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.error-title {
  color: var(--color-error);
  font-size: 1.8rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.error-message {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.error-details {
  text-align: left;
  margin-bottom: 2rem;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid var(--color-border);
}

.error-details summary {
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.error-details pre {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.error-button {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-button.primary {
  background: var(--color-primary);
  color: white;
}

.error-button.primary:hover {
  background: var(--color-primary-dark);
}

.error-button.secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.error-button.secondary:hover {
  background: var(--color-bg-hover);
}

.error-help {
  text-align: left;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
}

.error-help p {
  margin: 0 0 1rem 0;
  color: var(--color-text-primary);
  font-weight: 500;
}

.error-help ul {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--color-text-secondary);
}

.error-help li {
  margin-bottom: 0.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-container {
    padding: 2rem;
    margin: 1rem;
  }

  .error-icon {
    font-size: 3rem;
  }

  .error-title {
    font-size: 1.5rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .error-button {
    width: 100%;
  }
}
</style>