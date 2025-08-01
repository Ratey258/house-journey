<template>
  <div class="error-dialog-overlay" v-if="show" @click.self="handleClose">
    <div class="error-dialog" role="dialog" aria-modal="true">
      <div class="error-dialog-header">
        <h3>{{ title || '错误' }}</h3>
        <button class="close-button" @click="handleClose">&times;</button>
      </div>

      <div class="error-dialog-body">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" width="48" height="48">
            <circle cx="12" cy="12" r="11" fill="#f56c6c" />
            <path d="M12 7v6M12 17v.1" stroke="white" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>

        <div class="error-content">
          <div class="error-message">{{ message }}</div>

          <div v-if="timestamp" class="error-timestamp">
            {{ formatTimestamp(timestamp) }}
          </div>

          <div v-if="context" class="error-context">
            {{ context }}
          </div>
        </div>
      </div>

      <div v-if="details" class="error-details">
        <details>
          <summary>显示详细信息</summary>
          <div class="error-stack">
            <pre>{{ details }}</pre>
          </div>
        </details>
      </div>

      <div class="error-dialog-footer">
        <button
          v-if="showRestartButton"
          class="restart-button"
          @click="restartApp"
        >
          重启应用
        </button>

        <button class="dismiss-button" @click="handleClose">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { handleError, ErrorType, ErrorSeverity } from '../../../infrastructure/utils/errorHandler';

// ==================== 类型定义 ====================

/**
 * ErrorDialog Props接口
 */
interface Props {
  show?: boolean;
  title?: string;
  message?: string;
  details?: string;
  timestamp?: string;
  context?: string;
  fatal?: boolean;
}

/**
 * ErrorDialog Emits接口
 */
interface Emits {
  (e: 'close'): void;
}

// ==================== Props & Emits ====================

const props = withDefaults(defineProps<Props>(), {
  show: false,
  title: '错误',
  message: '应用程序发生错误',
  details: '',
  timestamp: '',
  context: '',
  fatal: false
});

const emit = defineEmits<Emits>();

// ==================== 计算属性 ====================

/**
 * 是否显示重启按钮
 */
const showRestartButton = computed(() => props.fatal);

// ==================== 方法 ====================

/**
 * 处理关闭事件
 */
const handleClose = (): void => {
  if (!props.fatal) {
    emit('close');
  }
};

/**
 * 重启应用
 */
const restartApp = (): void => {
  if ((window as any).electronAPI && (window as any).electronAPI.quitApp) {
    (window as any).electronAPI.quitApp();
  } else {
    window.location.reload();
  }
};

/**
 * 格式化时间戳为本地时间字符串
 * @param timestamp 时间戳
 * @returns 格式化后的时间字符串
 */
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (e) {
    handleError(e as Error, 'ErrorDialog (common)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    return timestamp;
  }
};
</script>

<style scoped>
.error-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.error-dialog {
  width: 90%;
  max-width: 500px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.error-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #f56c6c;
  color: white;
}

.error-dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.error-dialog-body {
  display: flex;
  padding: 20px;
  gap: 16px;
}

.error-icon {
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-message {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.error-timestamp {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.error-context {
  font-size: 14px;
  color: #555;
  background-color: #f5f5f5;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #f56c6c;
  margin-top: 8px;
}

.error-details {
  border-top: 1px solid #eee;
  padding: 16px 20px;
}

.error-details summary {
  cursor: pointer;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
  outline: none;
}

.error-details summary:hover {
  color: #333;
}

.error-stack {
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
  overflow: auto;
  max-height: 200px;
}

.error-stack pre {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #444;
  white-space: pre-wrap;
  word-break: break-word;
}

.error-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.restart-button,
.dismiss-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
}

.restart-button {
  background-color: #e74c3c;
  color: white;
}

.restart-button:hover {
  background-color: #c0392b;
  transform: translateY(-1px);
}

.dismiss-button {
  background-color: #6c757d;
  color: white;
}

.dismiss-button:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.restart-button:active,
.dismiss-button:active {
  transform: translateY(0);
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .error-dialog {
    background-color: #2d3748;
    color: #e2e8f0;
  }

  .error-dialog-header {
    background-color: #e53e3e;
  }

  .error-message {
    color: #e2e8f0;
  }

  .error-timestamp,
  .error-details summary {
    color: #a0aec0;
  }

  .error-context {
    background-color: #4a5568;
    color: #e2e8f0;
  }

  .error-stack {
    background-color: #1a202c;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .error-dialog-footer {
    background-color: #4a5568;
    border-color: #2d3748;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-dialog {
    width: 95%;
    margin: 10px;
  }

  .error-dialog-body {
    flex-direction: column;
    text-align: center;
  }

  .error-dialog-footer {
    flex-direction: column;
  }

  .restart-button,
  .dismiss-button {
    width: 100%;
  }
}
</style>
