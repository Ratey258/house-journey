<!-- 
  Toast通知组件
  提供全局消息通知功能
-->
<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast" 
        :class="`toast-${toast.type}`"
      >
        <div class="toast-icon">
          <span v-if="toast.type === 'success'">✓</span>
          <span v-else-if="toast.type === 'info'">ℹ</span>
          <span v-else-if="toast.type === 'warning'">⚠</span>
          <span v-else-if="toast.type === 'error'">✖</span>
        </div>
        <div class="toast-content">
          <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" @click="removeToast(toast.id)">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { ref, onMounted, inject, onBeforeUnmount } from 'vue';
import { handleError, ErrorType, ErrorSeverity } from '../../../infrastructure/utils/errorHandler';

export default {
  name: 'Toast',
  setup() {
    // 通知列表
    const toasts = ref([]);
    
    // 尝试获取音频管理器
    const audio = inject('audio', null);
    
    // 用于取消事件总线订阅
    let unsubscribe = null;
    
    // 添加新通知
    const addToast = (options) => {
      if (typeof options === 'string') {
        options = { message: options };
      }
      
      const toast = {
        id: Date.now(),
        type: options.type || 'info',
        message: options.message || '',
        title: options.title || '',
        duration: options.duration || 3000,
        onClose: options.onClose
      };
      
      toasts.value.push(toast);
      
      // 播放音效
      playToastSound(toast.type);
      
      // 自动关闭
      if (toast.duration > 0) {
        setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
      }
    };
    
    // 移除通知
    const removeToast = (id) => {
      const index = toasts.value.findIndex(t => t.id === id);
      if (index !== -1) {
        const toast = toasts.value[index];
        toasts.value.splice(index, 1);
        
        // 调用关闭回调
        if (typeof toast.onClose === 'function') {
          toast.onClose(toast);
        }
      }
    };

    // 播放通知音效
    const playToastSound = (type) => {
      if (!audio) return;
      
      // 根据类型选择音效
      const soundId = `toast_${type}`;
      
      // 如果音效已加载，直接播放
      if (audio.sounds && audio.sounds[soundId]) {
        audio.play(soundId);
        return;
      }
      
      // 否则加载并播放音效
      // 注意：实际项目中应该预先加载所有音效
      const soundUrls = {
        success: '/sounds/success.mp3',
        info: '/sounds/info.mp3',
        warning: '/sounds/warning.mp3',
        error: '/sounds/error.mp3'
      };
      
      if (soundUrls[type] && audio.load) {
        audio.load(soundId, soundUrls[type], {
          volume: 0.5,
          onload: () => audio.play(soundId)
        });
      }
    };
    
    // 组件挂载时设置事件总线
    onMounted(() => {
      try {
        // 尝试导入并使用事件总线
        import('@vueuse/core').then(module => {
          const { useEventBus } = module;
          const eventBus = useEventBus('toast');
          
          const handleToastEvent = (options) => {
            if (typeof options === 'string') {
              addToast({ message: options });
            } else {
              addToast(options);
            }
          };
          
          // 订阅事件
          eventBus.on(handleToastEvent);
          
          // 保存取消订阅函数
          unsubscribe = () => eventBus.off(handleToastEvent);
        }).catch(err => {
          console.warn('无法导入事件总线:', err);
        });
      } catch (err) {
        handleError(err, 'Toast (common)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
        console.warn('设置事件总线失败:', err);
      }
    });
    
    // 组件卸载时取消订阅
    onBeforeUnmount(() => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });

    return {
      toasts,
      addToast,
      removeToast
    };
  }
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  pointer-events: auto;
  transition: all 0.3s ease;
}

.toast-success {
  border-left: 4px solid #2ECC71;
}

.toast-info {
  border-left: 4px solid #3498DB;
}

.toast-warning {
  border-left: 4px solid #F39C12;
}

.toast-error {
  border-left: 4px solid #E74C3C;
}

.toast-icon {
  font-size: 20px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-success .toast-icon {
  color: #2ECC71;
}

.toast-info .toast-icon {
  color: #3498DB;
}

.toast-warning .toast-icon {
  color: #F39C12;
}

.toast-error .toast-icon {
  color: #E74C3C;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.toast-message {
  color: #333;
  line-height: 1.4;
  font-size: 14px;
}

.toast-close {
  background: none;
  border: none;
  color: #999;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  margin: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.toast-close:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #666;
}

/* 动画效果 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>

<style>
/* 全局样式，确保图标正确显示 */
.toast-icon svg {
  width: 20px;
  height: 20px;
}

.toast-close svg {
  width: 16px;
  height: 16px;
}
</style> 