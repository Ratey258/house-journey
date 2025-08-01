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

<script>
import { handleError, ErrorType, ErrorSeverity } from '../../../infrastructure/utils/errorHandler';

export default {
  name: 'ErrorDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '错误'
    },
    message: {
      type: String,
      default: '应用程序发生错误'
    },
    details: {
      type: String,
      default: ''
    },
    timestamp: {
      type: String,
      default: ''
    },
    context: {
      type: String,
      default: ''
    },
    fatal: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['close'],
  
  computed: {
    showRestartButton() {
      return this.fatal;
    }
  },
  
  methods: {
    handleClose() {
      if (!this.fatal) {
        this.$emit('close');
      }
    },
    
    restartApp() {
      if (window.electronAPI && window.electronAPI.quitApp) {
        window.electronAPI.quitApp();
      } else {
        window.location.reload();
      }
    },
    
    // 格式化时间戳为本地时间字符串
    formatTimestamp(timestamp) {
      try {
        const date = new Date(timestamp);
        return date.toLocaleString();
      } catch (e) {
        handleError(e, 'ErrorDialog (common)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
        return timestamp;
      }
    }
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
  max-height: 80vh;
}

.error-dialog-header {
  padding: 16px 20px;
  background-color: #f56c6c;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  line-height: 1;
  padding: 0;
  margin: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.error-dialog-body {
  padding: 20px;
  display: flex;
  gap: 16px;
  overflow-y: auto;
}

.error-icon {
  flex-shrink: 0;
}

.error-content {
  flex-grow: 1;
}

.error-message {
  margin-bottom: 12px;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
}

.error-timestamp {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.error-context {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-style: italic;
}

.error-details {
  padding: 0 20px;
  margin-bottom: 20px;
}

.error-details summary {
  color: #f56c6c;
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
}

.error-details summary:hover {
  text-decoration: underline;
}

.error-stack {
  margin-top: 8px;
  padding: 12px;
  background-color: #f8f8f8;
  border-radius: 4px;
  overflow-x: auto;
}

.error-stack pre {
  margin: 0;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-dialog-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #eee;
}

.restart-button, .dismiss-button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.restart-button {
  background-color: #f56c6c;
  color: white;
}

.restart-button:hover {
  background-color: #e74c3c;
}

.dismiss-button {
  background-color: #eee;
  color: #333;
}

.dismiss-button:hover {
  background-color: #ddd;
}
</style> 