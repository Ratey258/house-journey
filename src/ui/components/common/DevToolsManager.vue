<template>
  <div>
    <FloatingDevTools v-if="isVisible" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import FloatingDevTools from './FloatingDevTools.vue';

const isVisible = ref(false);

// 处理显示/隐藏开发工具的事件
function handleShowDevTools() {
  isVisible.value = true;
}

function handleCloseDevTools() {
  isVisible.value = false;
}

// 处理快捷键
function handleKeyDown(e) {
  // Ctrl+Shift+D 打开开发工具
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    isVisible.value = !isVisible.value;
  }
}

// 组件挂载时设置事件监听器
onMounted(() => {
  // 监听来自菜单和其他组件的打开命令
  window.addEventListener('show-dev-tools', handleShowDevTools);
  // 监听关闭命令
  window.addEventListener('close-dev-tools', handleCloseDevTools);
  // 监听快捷键
  document.addEventListener('keydown', handleKeyDown);
});

// 组件销毁时清理事件监听器
onBeforeUnmount(() => {
  window.removeEventListener('show-dev-tools', handleShowDevTools);
  window.removeEventListener('close-dev-tools', handleCloseDevTools);
  document.removeEventListener('keydown', handleKeyDown);
});
</script>
