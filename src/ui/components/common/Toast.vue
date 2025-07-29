<!--
  Toast通知组件
  提供全局消息通知功能
-->
<template>
  <div class="toast-container" :class="{ 'modal-open': hasModalBackdrop }">
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

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useUiStore } from '@/stores/uiStore';

// 获取UI存储
const uiStore = useUiStore();
// 直接从 uiStore 获取 toasts 数据
const toasts = computed(() => uiStore.toasts);

// 检查页面中是否存在模态框
const hasModalBackdrop = ref(false);

// 检测模态框存在
const checkModalBackdrop = () => {
  hasModalBackdrop.value = !!document.querySelector('.modal-backdrop');
};

// 移除通知
const removeToast = (id) => {
  uiStore.removeToast(id);
};

// 播放提示音
const playToastSound = (type) => {
  // 项目不需要音频功能，此方法只保留空壳
  console.log(`模拟播放Toast音效: ${type}（音频功能已禁用）`);
};

// 监听 toasts 变化，播放相应音效
const prevToastsLength = ref(0);
const watchToasts = () => {
  if (toasts.value.length > prevToastsLength.value) {
    // 有新的 toast 添加
    const newToast = toasts.value[0]; // 最新的 toast 在前面
    if (newToast) {
      playToastSound(newToast.type);
    }
    // 检查模态框状态
    checkModalBackdrop();
  }
  prevToastsLength.value = toasts.value.length;
};

// 设置观察
onMounted(() => {
  // 初始化 prevToastsLength
  prevToastsLength.value = toasts.value.length;
  
  // 初始检测模态框
  checkModalBackdrop();

  // 设置观察定时器
  const interval = setInterval(() => {
    watchToasts();
    checkModalBackdrop();
  }, 100);

  onBeforeUnmount(() => {
    clearInterval(interval);
  });
});
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

/* 模态框打开时Toast的样式 - 将Toast移至右下角，避免遮挡模态框内容 */
.toast-container.modal-open {
  top: auto;
  bottom: 20px;
  left: auto;
  right: 20px;
  transform: none;
  max-width: 300px;
  align-items: flex-end;
}

/* 媒体查询：小屏幕设备上的位置调整 */
@media (max-width: 768px) {
  .toast-container {
    top: 12px;
    max-width: 90%;
  }
  
  .toast-container.modal-open {
    bottom: 10px;
    right: 10px;
    max-width: 80%;
  }
}

/* 设置Toast的展示位置相对于其他UI元素 */
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
  animation: fadeInOut 3s ease-in-out;
  position: relative;
  z-index: 10000; /* 确保Toast总是显示在最顶层 */
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

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  10% {
    opacity: 1;
    transform: translateY(0);
  }
  90% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* 模态框打开时Toast的动画效果 */
.modal-open .toast {
  animation: fadeInOutCorner 3s ease-in-out;
}

@keyframes fadeInOutCorner {
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  10% {
    opacity: 1;
    transform: translateX(0);
  }
  90% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(20px);
  }
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

/* 模态框打开时Toast的进入和离开动画 */
.modal-open .toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.modal-open .toast-leave-to {
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
