/**
 * 统一错误处理工具 - TypeScript版本
 * 提供全应用范围的错误处理机制，包含完整的类型安全
 */
import { ref, type Ref } from 'vue';
import { ErrorType, ErrorSeverity, type ErrorInfo, type ErrorMetadata, type EnhancedError } from './errorTypes';
import i18n from '../../i18n';
import electronLog from 'electron-log';

// 重新导出ErrorType和ErrorSeverity，使其他文件可以直接从errorHandler导入
export { ErrorType, ErrorSeverity, type ErrorInfo, type ErrorMetadata, type EnhancedError };

// UI Store接口定义
interface UiStore {
  showErrorDialog: (error: ErrorDialogOptions) => void;
  showToast: (toast: ToastOptions) => void;
}

interface ErrorDialogOptions {
  title: string;
  message: string;
  details?: string;
  type: string;
  severity: ErrorSeverity;
}

interface ToastOptions {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration?: number;
}

// Electron API接口定义
interface ElectronAPI {
  logError?: (errorInfo: ErrorInfo) => void;
  exportErrorLogs?: (logs: ErrorInfo[]) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// 错误日志存储
const errorLogs: Ref<ErrorInfo[]> = ref([]);
const MAX_ERROR_LOGS = 200; // 最大保留日志数量

// 游戏运行状态标记
const GAME_RUNNING_FLAG = 'gameRunning';
const LAST_ACTIVITY_KEY = 'lastGameActivity';
const ACTIVITY_TIMEOUT = 300000; // 5分钟无操作视为非活动状态

// 缓存uiStore实例
let cachedUiStore: UiStore | null = null;

/**
 * 获取UI Store实例
 * @returns UI Store实例的Promise
 */
async function getUiStore(): Promise<UiStore | null> {
  if (cachedUiStore) {
    return cachedUiStore;
  }

  // 重试次数和延迟
  const maxRetries = 3;
  const retryDelay = 300;
  
  // 重试函数
  const retry = async (attempt = 0): Promise<UiStore | null> => {
    try {
      const module = await import('../../stores/uiStore');
      if (module && typeof module.useUiStore === 'function') {
        const store = module.useUiStore();
        // 验证store是否有效
        if (store && typeof store === 'object') {
          cachedUiStore = store as UiStore;
          return store as UiStore;
        } else {
          throw new Error('Invalid uiStore instance');
        }
      } else {
        throw new Error('useUiStore function not found');
      }
    } catch (err) {
      console.error(`Failed to import uiStore (attempt ${attempt + 1}/${maxRetries}):`, err);
      
      // 如果还有重试次数，则延迟后重试
      if (attempt < maxRetries - 1) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return retry(attempt + 1);
      }
      
      // 重试次数用完，返回null
      return null;
    }
  };
  
  return retry();
}

/**
 * 处理错误
 * @param error 错误对象
 * @param context 错误上下文
 * @param type 错误类型
 * @param severity 错误严重程度
 * @returns 错误信息对象
 */
export function handleError(
  error: Error | EnhancedError, 
  context: string, 
  type: ErrorType = ErrorType.UNKNOWN, 
  severity: ErrorSeverity = ErrorSeverity.ERROR
): ErrorInfo {
  // 生成唯一ID
  const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 构建错误信息
  const errorInfo: ErrorInfo = {
    id,
    message: error.message || '未知错误',
    context,
    type,
    severity,
    timestamp: new Date().toISOString(),
    stack: error.stack,
    metadata: (error as EnhancedError).metadata || {},
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined
  };
  
  // 日志记录
  logError(errorInfo);
  
  // 用户通知 - 根据严重程度决定通知方式
  if (severity === ErrorSeverity.FATAL || severity === ErrorSeverity.ERROR) {
    notifyUserWithDialog(errorInfo);
  } else if (severity === ErrorSeverity.WARNING) {
    notifyUserWithToast(errorInfo);
  }
  
  // Electron日志 - 确保错误可追溯
  if (window.electronAPI && window.electronAPI.logError) {
    window.electronAPI.logError(errorInfo);
  } else {
    // 回退到electron-log
    electronLog.error(`[${type}][${context}]`, error);
  }
  
  // 开发环境下控制台输出更多信息
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${type.toUpperCase()}][${context}]`, error);
  }
  
  return errorInfo;
}

/**
 * 记录错误日志
 * @param errorInfo 错误信息对象
 */
function logError(errorInfo: ErrorInfo): void {
  // 添加到错误日志
  errorLogs.value.unshift(errorInfo);
  
  // 限制日志数量
  if (errorLogs.value.length > MAX_ERROR_LOGS) {
    errorLogs.value = errorLogs.value.slice(0, MAX_ERROR_LOGS);
  }
  
  // 尝试将错误信息保存到本地存储
  try {
    const serializedLogs = JSON.stringify(errorLogs.value);
    localStorage.setItem('errorLogs', serializedLogs);
  } catch (e) {
    console.error('Failed to save error logs to localStorage:', e);
  }
}

/**
 * 获取错误日志
 * @returns 错误日志列表
 */
export function getErrorLogs(): ErrorInfo[] {
  return [...errorLogs.value];
}

/**
 * 清除错误日志
 */
export function clearErrorLogs(): void {
  errorLogs.value = [];
  try {
    localStorage.removeItem('errorLogs');
  } catch (e) {
    console.error('Failed to clear error logs from localStorage:', e);
  }
}

/**
 * 加载保存的错误日志
 * @returns 错误日志列表的Promise
 */
export function loadErrorLogs(): Promise<ErrorInfo[]> {
  return new Promise((resolve) => {
    try {
      const savedLogs = localStorage.getItem('errorLogs');
      if (savedLogs) {
        const parsedLogs: ErrorInfo[] = JSON.parse(savedLogs);
        errorLogs.value = parsedLogs;
        
        // 确保不超过最大数量
        if (errorLogs.value.length > MAX_ERROR_LOGS) {
          errorLogs.value = errorLogs.value.slice(0, MAX_ERROR_LOGS);
        }
      }
      resolve([...errorLogs.value]);
    } catch (e) {
      console.error('Failed to load error logs from localStorage:', e);
      resolve([]);
    }
  });
}

/**
 * 获取本地化的错误消息
 * @param errorInfo 错误信息对象
 * @returns 本地化的错误消息
 */
function getLocalizedErrorMessage(errorInfo: ErrorInfo): string {
  try {
    // 尝试使用错误类型和消息的组合键
    const specificKey = `errors.${errorInfo.type}.specific.${errorInfo.message
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w]/g, '')}`;
    
    // 常规错误类型键
    const typeKey = `errors.${errorInfo.type}.default`;
    
    // 通用错误键
    const genericKey = 'errors.generic';
    
    // 按优先级尝试获取本地化消息
    if (i18n.global.te(specificKey)) {
      return i18n.global.t(specificKey);
    } else if (i18n.global.te(typeKey)) {
      return i18n.global.t(typeKey);
    } else if (i18n.global.te(genericKey)) {
      return i18n.global.t(genericKey);
    } else {
      return errorInfo.message;
    }
  } catch (err) {
    console.warn('Failed to get localized error message:', err);
    return errorInfo.message;
  }
}

/**
 * 通过对话框通知用户
 * @param errorInfo 错误信息对象
 */
async function notifyUserWithDialog(errorInfo: ErrorInfo): Promise<void> {
  try {
    const uiStore = await getUiStore();
    if (uiStore && uiStore.showErrorDialog) {
      const localizedMessage = getLocalizedErrorMessage(errorInfo);
      uiStore.showErrorDialog({
        title: i18n.global.t('errors.dialog.title'),
        message: localizedMessage,
        details: errorInfo.stack,
        type: errorInfo.type,
        severity: errorInfo.severity
      });
    } else {
      // 回退到浏览器原生对话框
      const localizedMessage = getLocalizedErrorMessage(errorInfo);
      alert(`${i18n.global.t('errors.dialog.title')}: ${localizedMessage}`);
    }
  } catch (err) {
    console.error('Failed to show error dialog:', err);
    // 最后的回退
    alert(`错误: ${errorInfo.message}`);
  }
}

/**
 * 通过Toast通知用户
 * @param errorInfo 错误信息对象
 */
async function notifyUserWithToast(errorInfo: ErrorInfo): Promise<void> {
  try {
    const uiStore = await getUiStore();
    if (uiStore && uiStore.showToast) {
      const localizedMessage = getLocalizedErrorMessage(errorInfo);
      uiStore.showToast({
        type: errorInfo.severity === ErrorSeverity.WARNING ? 'warning' : 'error',
        message: localizedMessage,
        duration: 5000
      });
    } else {
      // 回退到控制台
      console.warn(`Toast Notification: ${errorInfo.message}`);
    }
  } catch (err) {
    console.error('Failed to show toast notification:', err);
  }
}

/**
 * 错误包装函数
 * @param fn 要包装的函数
 * @param context 错误上下文
 * @returns 包装后的函数
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T, 
  context: string
): (...args: Parameters<T>) => ReturnType<T> | void {
  return (...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // 如果是Promise，添加catch处理
      if (result && typeof result.catch === 'function') {
        return result.catch((error: Error) => {
          handleError(error, context, ErrorType.UNKNOWN, ErrorSeverity.ERROR);
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error, context, ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    }
  };
}

/**
 * 游戏专用错误包装函数
 * @param fn 要包装的函数
 * @param context 错误上下文
 * @returns 包装后的函数
 */
export function withGameErrorHandling<T extends (...args: any[]) => any>(
  fn: T, 
  context: string
): (...args: Parameters<T>) => ReturnType<T> | void {
  return withErrorHandling(fn, `Game.${context}`);
}

/**
 * 设置全局错误处理器
 * @param app Vue应用实例
 */
export function setupGlobalErrorHandlers(app?: any): void {
  // Vue错误处理
  if (app && app.config) {
    app.config.errorHandler = (err: Error, instance: any, info: string) => {
      handleError(
        err,
        `Vue.${info}`,
        ErrorType.SYSTEM,
        ErrorSeverity.ERROR
      );
    };
  }
  
  // 未捕获的Promise错误
  window.addEventListener('unhandledrejection', event => {
    handleError(
      event.reason || new Error('未处理的Promise异常'), 
      'Promise', 
      ErrorType.SYSTEM, 
      ErrorSeverity.ERROR
    );
  });
  
  // 全局JS错误处理
  window.addEventListener('error', event => {
    // 忽略资源加载错误
    if (event.error) {
      handleError(
        event.error,
        '全局异常',
        ErrorType.SYSTEM,
        ErrorSeverity.ERROR
      );
    }
  });
  
  // 初始化错误日志
  loadErrorLogs();
  
  // 注册页面关闭前处理
  window.addEventListener('beforeunload', () => {
    clearGameRunningMark();
  });
}

/**
 * 标记游戏正在运行
 * 用于检测异常退出
 */
export function markGameRunning(): void {
  try {
    localStorage.setItem(GAME_RUNNING_FLAG, 'true');
    updateGameActivity();
  } catch (e) {
    console.warn('Failed to set game running flag:', e);
  }
}

/**
 * 清除游戏运行标记
 * 在正常退出时调用
 */
export function clearGameRunningMark(): void {
  try {
    localStorage.removeItem(GAME_RUNNING_FLAG);
  } catch (e) {
    console.warn('Failed to clear game running flag:', e);
  }
}

/**
 * 检查游戏是否异常退出
 * @returns 是否检测到异常退出
 */
export function checkGameAbnormalExit(): boolean {
  try {
    const wasRunning = localStorage.getItem(GAME_RUNNING_FLAG) === 'true';
    
    if (!wasRunning) {
      return false;
    }
    
    // 检查最后活动时间
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (lastActivity) {
      const lastActiveTime = parseInt(lastActivity, 10);
      const now = Date.now();
      
      // 如果最后活动时间在5分钟内，认为是异常退出
      // 否则可能是用户长时间未操作，浏览器自动关闭
      if (now - lastActiveTime < ACTIVITY_TIMEOUT) {
        return true;
      }
    }
    
    return false;
  } catch (e) {
    console.warn('Failed to check game running flag:', e);
    return false;
  }
}

/**
 * 更新游戏活动时间戳
 * 记录用户最后交互时间
 */
export function updateGameActivity(): void {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Failed to update game activity timestamp:', e);
  }
}

/**
 * 导出错误日志
 * @returns 导出结果的Promise
 */
export async function exportErrorLogs(): Promise<boolean> {
  return new Promise(async (resolve) => {
    try {
      if (window.electronAPI && window.electronAPI.exportErrorLogs) {
        const result = await window.electronAPI.exportErrorLogs(errorLogs.value);
        resolve(result.success);
      } else {
        // 浏览器环境下的导出
        const blob = new Blob([JSON.stringify(errorLogs.value, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-logs-${new Date().toISOString().replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve(true);
      }
    } catch (error) {
      console.error('Failed to export error logs:', error);
      resolve(false);
    }
  });
}