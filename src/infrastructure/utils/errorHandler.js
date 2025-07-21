/**
 * 统一错误处理工具
 * 提供全应用范围的错误处理机制
 */
import { ref } from 'vue';
import { ErrorType, ErrorSeverity } from './errorTypes';
import i18n from '../../i18n';
import electronLog from 'electron-log';

// 重新导出ErrorType和ErrorSeverity，使其他文件可以直接从errorHandler导入
export { ErrorType, ErrorSeverity };

// 错误日志存储
const errorLogs = ref([]);
const MAX_ERROR_LOGS = 200; // 最大保留日志数量

// 游戏运行状态标记
const GAME_RUNNING_FLAG = 'gameRunning';
const LAST_ACTIVITY_KEY = 'lastGameActivity';
const ACTIVITY_TIMEOUT = 300000; // 5分钟无操作视为非活动状态

// 缓存uiStore实例
let cachedUiStore = null;

/**
 * 获取UI Store实例
 * @returns {Promise<Object>} UI Store实例
 */
async function getUiStore() {
  if (cachedUiStore) {
    return cachedUiStore;
  }

  // 重试次数和延迟
  const maxRetries = 3;
  const retryDelay = 300;
  
  // 重试函数
  const retry = async (attempt = 0) => {
    try {
      const module = await import('../../stores/uiStore');
      if (module && typeof module.useUiStore === 'function') {
        const store = module.useUiStore();
        // 验证store是否有效
        if (store && typeof store === 'object') {
          cachedUiStore = store;
          return store;
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
 * @param {Error} error 错误对象
 * @param {string} context 错误上下文
 * @param {string} type 错误类型
 * @param {string} severity 错误严重程度
 * @returns {Object} 错误信息对象
 */
export function handleError(error, context, type = ErrorType.UNKNOWN, severity = ErrorSeverity.ERROR) {
  // 构建错误信息
  const errorInfo = {
    message: error.message || '未知错误',
    context,
    type,
    severity,
    timestamp: new Date().toISOString(),
    stack: error.stack,
    metadata: error.metadata || {}
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
 * @param {Object} errorInfo 错误信息对象
 */
function logError(errorInfo) {
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
 * @returns {Array} 错误日志列表
 */
export function getErrorLogs() {
  return [...errorLogs.value];
}

/**
 * 清除错误日志
 */
export function clearErrorLogs() {
  errorLogs.value = [];
  try {
    localStorage.removeItem('errorLogs');
  } catch (e) {
    console.error('Failed to clear error logs from localStorage:', e);
  }
}

/**
 * 加载保存的错误日志
 * @returns {Promise<Array>} 错误日志列表的Promise
 */
export function loadErrorLogs() {
  return new Promise((resolve) => {
    try {
      const savedLogs = localStorage.getItem('errorLogs');
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
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
 * @param {Object} errorInfo 错误信息对象
 * @returns {string} 本地化的错误消息
 */
function getLocalizedErrorMessage(errorInfo) {
  try {
    // 尝试使用错误类型和消息的组合键
    const specificKey = `errors.${errorInfo.type}.specific.${errorInfo.message
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w]/g, '')}`;
    
    // 常规错误类型键
    const typeKey = `errors.${errorInfo.type}.default`;
    
    // 默认错误信息
    const defaultMsg = '发生错误';
    
    // 尝试按优先级获取本地化消息
    if (i18n.global && i18n.global.te && i18n.global.te(specificKey)) {
      return i18n.global.t(specificKey);
    } else if (i18n.global && i18n.global.te && i18n.global.te(typeKey)) {
      return i18n.global.t(typeKey, { message: errorInfo.message });
    }
    return errorInfo.message || defaultMsg;
  } catch (e) {
    console.error('Error getting localized error message:', e);
    return errorInfo.message || '发生错误';
  }
}

/**
 * 弹窗通知用户
 * @param {Object} errorInfo 错误信息对象
 */
async function notifyUserWithDialog(errorInfo) {
  try {
    // 获取UI Store
    const uiStore = await getUiStore();
    
    if (uiStore && typeof uiStore.showErrorDialog === 'function') {
      uiStore.showErrorDialog({
        title: errorInfo.severity === ErrorSeverity.FATAL ? '严重错误' : '错误',
        message: getLocalizedErrorMessage(errorInfo),
        details: process.env.NODE_ENV !== 'production' ? errorInfo.stack : undefined,
        timestamp: errorInfo.timestamp,
        context: errorInfo.context
      });
    } else {
      // 备用方案
      console.error('UI Store不可用，使用备用错误提示');
      alert(getLocalizedErrorMessage(errorInfo));
    }
  } catch (e) {
    console.error('Error showing error dialog:', e);
    alert(getLocalizedErrorMessage(errorInfo));
  }
}

/**
 * Toast通知用户
 * @param {Object} errorInfo 错误信息对象
 */
async function notifyUserWithToast(errorInfo) {
  try {
    // 获取UI Store
    const uiStore = await getUiStore();
    
    if (uiStore && typeof uiStore.showToast === 'function') {
      uiStore.showToast({
        type: 'error',
        message: getLocalizedErrorMessage(errorInfo),
        duration: 5000
      });
    } else {
      // 降级到控制台输出
      console.warn(getLocalizedErrorMessage(errorInfo));
    }
  } catch (e) {
    console.warn('Error showing toast:', e);
  }
}

/**
 * 异步错误处理包装器
 * @param {Function} asyncFn 异步函数
 * @param {string} context 错误上下文
 * @param {string} type 错误类型
 * @param {string} severity 错误严重程度
 * @returns {Promise<any>} 异步函数的结果
 */
export async function withErrorHandling(asyncFn, context, type = ErrorType.UNKNOWN, severity = ErrorSeverity.ERROR) {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, context, type, severity);
    throw error; // 允许调用方继续处理错误
  }
}

/**
 * 专用于游戏核心系统的错误处理
 * @param {Function} asyncFn 异步函数
 * @param {string} context 上下文
 * @returns {Promise<any>} 异步函数的结果
 */
export async function withGameErrorHandling(asyncFn, context) {
  try {
    return await asyncFn();
  } catch (error) {
    // 尝试进行游戏状态恢复
    try {
      const { createEmergencySnapshot } = await import('../persistence/stateSnapshot');
      const gameStore = await import('../../stores').then(module => module.useGameStore());
      
      // 创建紧急快照，以便后续恢复
      createEmergencySnapshot(gameStore);
      
      // 尝试从快照恢复
      await attemptGameRecovery(gameStore);
    } catch (recoveryError) {
      console.error('Failed to recover game state:', recoveryError);
    }
    
    handleError(error, context, ErrorType.GAME_LOGIC, ErrorSeverity.ERROR);
    throw error;
  }
}

/**
 * 尝试游戏状态恢复
 * @param {Object} gameStore - 游戏状态存储
 * @returns {Promise<boolean>} 是否成功恢复
 */
export async function attemptGameRecovery(gameStore) {
  try {
    // 导入需要的模块
    const { loadLatestSnapshot, applySnapshot } = await import('../persistence/stateSnapshot');
    const { useUiStore } = await import('../../stores/uiStore');
    
    // 加载最近的状态快照
    const snapshot = await loadLatestSnapshot();
    if (!snapshot) {
      console.warn('无法恢复游戏状态：找不到快照');
      return false;
    }
    
    // 如果游戏已结束或未开始，不进行恢复
    if (gameStore.gameOver || !gameStore.gameStarted) {
      console.info('游戏未在活动状态，不进行恢复');
      return false;
    }
    
    // 显示恢复确认对话框
    const uiStore = useUiStore();
    return new Promise(resolve => {
      uiStore.showRecoveryDialog({
        snapshot,
        onRecover: async () => {
          const success = await applySnapshot(gameStore, snapshot);
          if (success) {
            uiStore.showToast({
              type: 'success',
              message: '游戏状态已成功恢复'
            });
          }
          resolve(success);
        },
        onCancel: () => {
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('恢复游戏状态时出错:', error);
    return false;
  }
}

/**
 * 设置全局错误处理器
 * @param {Vue} app - Vue应用实例
 */
export function setupGlobalErrorHandlers(app) {
  if (!app || !app.config) {
    console.warn('无法设置全局错误处理：app实例无效');
    return;
  }

  // 全局Vue错误处理
  app.config.errorHandler = (err, vm, info) => {
    // 获取组件名称
    let componentName = 'Unknown';
    try {
      if (vm && vm.$options && vm.$options.name) {
        componentName = vm.$options.name;
      } else if (vm && vm.$root) {
        componentName = 'Root Component';
      }
    } catch (e) {
      componentName = 'Error getting component name';
    }

    handleError(
      err, 
      `Vue组件: ${componentName}`, 
      ErrorType.COMPONENT, 
      ErrorSeverity.ERROR
    );
  };
  
  // 全局Promise错误处理
  window.addEventListener('unhandledrejection', event => {
    handleError(
      event.reason || new Error('未处理的Promise异常'), 
      'Promise', 
      ErrorType.ASYNC, 
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
        ErrorType.RUNTIME,
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
export function markGameRunning() {
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
export function clearGameRunningMark() {
  try {
    localStorage.removeItem(GAME_RUNNING_FLAG);
  } catch (e) {
    console.warn('Failed to clear game running flag:', e);
  }
}

/**
 * 检查游戏是否异常退出
 * @returns {boolean} 是否检测到异常退出
 */
export function checkGameAbnormalExit() {
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
export function updateGameActivity() {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Failed to update game activity timestamp:', e);
  }
}

/**
 * 导出错误日志
 * @returns {Promise<boolean>} 导出结果的Promise
 */
export async function exportErrorLogs() {
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