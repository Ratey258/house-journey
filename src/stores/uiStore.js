import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  // 错误对话框状态
  const errorDialogVisible = ref(false);
  const errorDialogData = ref(null);

  // Toast通知状态
  const toasts = ref([]);
  const toastTimeouts = ref({});

  // 恢复对话框状态
  const recoveryDialogVisible = ref(false);
  const recoveryDialogData = ref(null);

  // 通用对话框状态
  const dialogVisible = ref(false);
  const dialogData = ref(null);

  // 显示错误对话框
  function showErrorDialog(data) {
    errorDialogData.value = data;
    errorDialogVisible.value = true;
  }

  // 关闭错误对话框
  function closeErrorDialog() {
    errorDialogVisible.value = false;
    // 延迟清除数据，以便关闭动画完成
    setTimeout(() => {
      errorDialogData.value = null;
    }, 300);
  }

  // 添加Toast通知
  function addToast({ type = 'info', message = '', duration = 3000, action = null, actionText = '确定', actionCallback = null }) {
    const id = Date.now() + Math.random().toString(36).substring(2, 10);

    const toast = {
      id,
      type,
      message,
      action,
      actionText,
      actionCallback
    };

    // 添加到通知列表
    toasts.value.unshift(toast);

    // 限制通知数量
    if (toasts.value.length > 5) {
      const oldestToast = toasts.value.pop();
      if (toastTimeouts.value[oldestToast.id]) {
        clearTimeout(toastTimeouts.value[oldestToast.id]);
        delete toastTimeouts.value[oldestToast.id];
      }
    }

    // 设置自动隐藏
    if (duration > 0) {
      toastTimeouts.value[id] = setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }

  // 移除Toast通知
  function removeToast(id) {
    const index = toasts.value.findIndex(toast => toast.id === id);

    if (index !== -1) {
      toasts.value.splice(index, 1);

      // 清除超时
      if (toastTimeouts.value[id]) {
        clearTimeout(toastTimeouts.value[id]);
        delete toastTimeouts.value[id];
      }
    }
  }

  // 显示恢复对话框
  function showRecoveryDialog({ snapshot, message, title, allowCancel = true, onRecover, onCancel }) {
    recoveryDialogData.value = {
      snapshot,
      message: message || '检测到游戏意外中断。是否恢复上次保存的游戏状态？',
      title: title || '游戏恢复',
      allowCancel,
      onRecover: onRecover || (() => closeRecoveryDialog()),
      onCancel: onCancel || (() => closeRecoveryDialog())
    };
    recoveryDialogVisible.value = true;
  }

  // 关闭恢复对话框
  function closeRecoveryDialog() {
    recoveryDialogVisible.value = false;

    // 延迟清除数据
    setTimeout(() => {
      recoveryDialogData.value = null;
    }, 300);
  }

  // 显示通用对话框
  function showDialog(data) {
    dialogData.value = data;
    dialogVisible.value = true;
  }

  // 关闭通用对话框
  function closeDialog() {
    dialogVisible.value = false;
    // 延迟清除数据，以便关闭动画完成
    setTimeout(() => {
      dialogData.value = null;
    }, 300);
  }

  // 兼容旧版本API的showToast方法
  function showToast({ type = 'info', message = '', duration = 3000 }) {
    return addToast({ type, message, duration });
  }

  // 兼容旧版本API的closeToast方法
  function closeToast() {
    // 清除所有通知
    toasts.value.forEach(toast => {
      removeToast(toast.id);
    });
  }

  return {
    // 错误对话框
    errorDialogVisible,
    errorDialogData,
    showErrorDialog,
    closeErrorDialog,

    // Toast通知
    toasts,
    addToast,
    removeToast,
    showToast,
    closeToast,

    // 恢复对话框
    recoveryDialogVisible,
    recoveryDialogData,
    showRecoveryDialog,
    closeRecoveryDialog,

    // 通用对话框
    dialogVisible,
    dialogData,
    showDialog,
    closeDialog
  };
});
