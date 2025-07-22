<!--
  通用游戏对话框组件
-->
<template>
  <div class="dialog-overlay" v-if="dialogVisible" @click.self="onBackdropClick">
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 class="dialog-title">{{ dialogData.title }}</h2>
        <button class="dialog-close" @click="closeDialog" v-if="dialogData.showClose !== false">×</button>
      </div>
      <div class="dialog-content" v-html="formattedMessage"></div>
      <div class="dialog-actions">
        <button
          v-if="dialogData.showCancel !== false"
          class="dialog-button cancel-button"
          @click="onCancelClick"
        >
          {{ dialogData.cancelText || $t('common.cancel') }}
        </button>
        <button
          class="dialog-button confirm-button"
          @click="onConfirmClick"
        >
          {{ dialogData.confirmText || $t('common.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/stores/uiStore';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const uiStore = useUiStore();

// 对话框可见性和数据
const dialogVisible = computed(() => uiStore.dialogVisible);
const dialogData = computed(() => uiStore.dialogData || {});

// 格式化消息，支持换行符
const formattedMessage = computed(() => {
  if (!dialogData.value.message) return '';
  return dialogData.value.message.replace(/\n/g, '<br/>');
});

// 关闭对话框
const closeDialog = () => {
  uiStore.closeDialog();
};

// 点击确认按钮
const onConfirmClick = () => {
  if (typeof dialogData.value.onConfirm === 'function') {
    dialogData.value.onConfirm();
  }
  closeDialog();
};

// 点击取消按钮
const onCancelClick = () => {
  if (typeof dialogData.value.onCancel === 'function') {
    dialogData.value.onCancel();
  }
  closeDialog();
};

// 点击背景
const onBackdropClick = () => {
  if (dialogData.value.closeOnBackdrop !== false) {
    closeDialog();
  }
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  animation: dialog-appear 0.3s ease;
}

@keyframes dialog-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
  font-weight: bold;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #999;
}

.dialog-close:hover {
  color: #333;
}

.dialog-content {
  padding: 20px;
  line-height: 1.5;
  color: #2c3e50;
}

.dialog-actions {
  padding: 12px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.confirm-button {
  background-color: #4CAF50;
  color: white;
}

.confirm-button:hover {
  background-color: #45a049;
}

.cancel-button {
  background-color: #f44336;
  color: white;
}

.cancel-button:hover {
  background-color: #d32f2f;
}
</style>
