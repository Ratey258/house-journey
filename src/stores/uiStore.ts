import { defineStore } from 'pinia';
import { ref, readonly, type Ref } from 'vue';

// Toast interfaces
export interface ToastAction {
  text: string;
  callback: () => void;
}

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  action?: ToastAction | null;
  actionText?: string;
  actionCallback?: (() => void) | null;
}

export interface ToastOptions {
  type?: Toast['type'];
  message: string;
  duration?: number;
  action?: ToastAction | null;
  actionText?: string;
  actionCallback?: (() => void) | null;
}

// Error Dialog interfaces
export interface ErrorDialogData {
  title?: string;
  message: string;
  details?: string;
  error?: Error;
  allowRetry?: boolean;
  onRetry?: () => void;
  onCancel?: () => void;
}

// Recovery Dialog interfaces
export interface RecoveryDialogData {
  snapshot: any; // Game state snapshot
  message?: string;
  title?: string;
  allowCancel?: boolean;
  onRecover: () => void;
  onCancel: () => void;
}

// Generic Dialog interfaces
export interface DialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export const useUiStore = defineStore('ui', () => {
  // Error Dialog State
  const errorDialogVisible = ref<boolean>(false);
  const errorDialogData: Ref<ErrorDialogData | null> = ref(null);

  // Toast Notification State
  const toasts: Ref<Toast[]> = ref([]);
  const toastTimeouts: Ref<Record<string, NodeJS.Timeout>> = ref({});

  // Recovery Dialog State
  const recoveryDialogVisible = ref<boolean>(false);
  const recoveryDialogData: Ref<RecoveryDialogData | null> = ref(null);

  // Generic Dialog State
  const dialogVisible = ref<boolean>(false);
  const dialogData: Ref<DialogData | null> = ref(null);

  // Error Dialog Actions
  
  /**
   * 显示错误对话框
   */
  function showErrorDialog(data: ErrorDialogData): void {
    errorDialogData.value = data;
    errorDialogVisible.value = true;
  }

  /**
   * 关闭错误对话框
   */
  function closeErrorDialog(): void {
    errorDialogVisible.value = false;
    // 延迟清除数据，以便关闭动画完成
    setTimeout(() => {
      errorDialogData.value = null;
    }, 300);
  }

  // Toast Notification Actions
  
  /**
   * 添加Toast通知
   */
  function addToast(options: ToastOptions): string {
    const {
      type = 'info',
      message = '',
      duration = 3000,
      action = null,
      actionText = '确定',
      actionCallback = null
    } = options;

    // 如果有相同内容的消息，先移除它
    const existingToast = toasts.value.find(t => t.message === message);
    if (existingToast) {
      removeToast(existingToast.id);
    }

    const id = Date.now() + Math.random().toString(36).substring(2, 10);

    const toast: Toast = {
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
      if (oldestToast && toastTimeouts.value[oldestToast.id]) {
        clearTimeout(toastTimeouts.value[oldestToast.id]);
        delete toastTimeouts.value[oldestToast.id];
      }
    }

    // 设置自动隐藏（强制使用3秒）
    toastTimeouts.value[id] = setTimeout(() => {
      removeToast(id);
    }, 3000);

    return id;
  }

  /**
   * 移除Toast通知
   */
  function removeToast(id: string): void {
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

  // Recovery Dialog Actions
  
  /**
   * 显示恢复对话框
   */
  function showRecoveryDialog(options: RecoveryDialogData): void {
    const {
      snapshot,
      message = '检测到游戏意外中断。是否恢复上次保存的游戏状态？',
      title = '游戏恢复',
      allowCancel = true,
      onRecover = () => closeRecoveryDialog(),
      onCancel = () => closeRecoveryDialog()
    } = options;

    recoveryDialogData.value = {
      snapshot,
      message,
      title,
      allowCancel,
      onRecover,
      onCancel
    };
    recoveryDialogVisible.value = true;
  }

  /**
   * 关闭恢复对话框
   */
  function closeRecoveryDialog(): void {
    recoveryDialogVisible.value = false;

    // 延迟清除数据
    setTimeout(() => {
      recoveryDialogData.value = null;
    }, 300);
  }

  // Generic Dialog Actions
  
  /**
   * 显示通用对话框
   */
  function showDialog(data: DialogData): void {
    dialogData.value = data;
    dialogVisible.value = true;
  }

  /**
   * 关闭通用对话框
   */
  function closeDialog(): void {
    dialogVisible.value = false;
    // 延迟清除数据，以便关闭动画完成
    setTimeout(() => {
      dialogData.value = null;
    }, 300);
  }

  // Legacy API compatibility

  /**
   * 兼容旧版本API的showToast方法
   * @deprecated 使用 addToast 代替
   */
  function showToast(options: Pick<ToastOptions, 'type' | 'message' | 'duration'>): string {
    const { type = 'info', message = '', duration = 3000 } = options;
    return addToast({ type, message, duration });
  }

  /**
   * 兼容旧版本API的closeToast方法
   * @deprecated 使用 removeToast 代替
   */
  function closeToast(): void {
    // 清除所有通知
    toasts.value.forEach(toast => {
      removeToast(toast.id);
    });
  }

  return {
    // Error Dialog
    errorDialogVisible: readonly(errorDialogVisible),
    errorDialogData: readonly(errorDialogData),
    showErrorDialog,
    closeErrorDialog,

    // Toast Notifications
    toasts: readonly(toasts),
    addToast,
    removeToast,
    showToast, // deprecated
    closeToast, // deprecated

    // Recovery Dialog
    recoveryDialogVisible: readonly(recoveryDialogVisible),
    recoveryDialogData: readonly(recoveryDialogData),
    showRecoveryDialog,
    closeRecoveryDialog,

    // Generic Dialog
    dialogVisible: readonly(dialogVisible),
    dialogData: readonly(dialogData),
    showDialog,
    closeDialog
  };
});

export type UiStore = ReturnType<typeof useUiStore>;