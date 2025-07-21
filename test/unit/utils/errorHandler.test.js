import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  handleError, 
  ErrorType, 
  ErrorSeverity,
  getErrorLogs,
  clearErrorLogs,
  withErrorHandling
} from '../../../src/utils/errorHandler';

// 模拟依赖
vi.mock('vue', () => ({
  ref: vi.fn(val => ({
    value: val,
    _isRef: true
  }))
}));

vi.mock('electron-log', () => ({
  default: {
    error: vi.fn()
  }
}));

// 模拟localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// 模拟动态导入
vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: vi.fn(() => ({
    showErrorDialog: vi.fn(),
    showToast: vi.fn()
  }))
}));

describe('错误处理工具测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // 重置console方法
    console.error = vi.fn();
    console.warn = vi.fn();
  });
  
  describe('handleError', () => {
    it('应创建正确格式的错误信息', () => {
      const testError = new Error('测试错误');
      const context = '测试上下文';
      
      const result = handleError(testError, context);
      
      expect(result).toHaveProperty('message', '测试错误');
      expect(result).toHaveProperty('context', context);
      expect(result).toHaveProperty('type', ErrorType.UNKNOWN);
      expect(result).toHaveProperty('severity', ErrorSeverity.ERROR);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('stack');
    });
    
    it('应根据错误严重程度选择不同的通知方式', async () => {
      const testError = new Error('严重错误');
      
      // 测试严重错误
      handleError(testError, 'test', ErrorType.SYSTEM, ErrorSeverity.FATAL);
      
      // 等待动态导入完成
      await vi.dynamicImportSettled();
      
      // 检查是否调用了正确的通知方法
      const uiStore = (await import('../../../src/stores/uiStore')).useUiStore();
      expect(uiStore.showErrorDialog).toHaveBeenCalled();
      
      // 测试警告级别错误
      vi.clearAllMocks();
      handleError(testError, 'test', ErrorType.SYSTEM, ErrorSeverity.WARNING);
      
      // 等待动态导入完成
      await vi.dynamicImportSettled();
      
      // 检查是否调用了正确的通知方法
      expect(uiStore.showToast).toHaveBeenCalled();
    });
    
    it('应记录错误到日志', () => {
      const testError = new Error('测试错误');
      
      handleError(testError, 'test');
      
      // 验证错误被添加到日志
      const logs = getErrorLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('测试错误');
    });
  });
  
  describe('withErrorHandling', () => {
    it('应正确包装异步函数并处理错误', async () => {
      const successFn = vi.fn().mockResolvedValue('成功');
      const errorFn = vi.fn().mockRejectedValue(new Error('异步错误'));
      
      // 测试成功情况
      const successResult = await withErrorHandling(successFn, 'test');
      expect(successResult).toBe('成功');
      
      // 测试错误情况
      try {
        await withErrorHandling(errorFn, 'test');
        // 如果没有抛出错误，则测试失败
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('异步错误');
        
        // 验证错误被正确处理
        const logs = getErrorLogs();
        expect(logs.length).toBe(2); // 包括前一个测试的错误
        expect(logs[0].message).toBe('异步错误');
      }
    });
  });
  
  describe('错误日志管理', () => {
    it('应正确清除错误日志', () => {
      // 添加一些错误
      handleError(new Error('错误1'), 'test');
      handleError(new Error('错误2'), 'test');
      
      // 验证错误被添加
      expect(getErrorLogs().length).toBe(2);
      
      // 清除日志
      clearErrorLogs();
      
      // 验证日志被清除
      expect(getErrorLogs().length).toBe(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('errorLogs');
    });
    
    it('应限制错误日志数量', () => {
      // 模拟MAX_ERROR_LOGS为较小的值进行测试
      const MAX_LOGS = 5;
      
      // 添加超过限制的错误
      for (let i = 0; i < MAX_LOGS + 3; i++) {
        handleError(new Error(`错误${i}`), 'test');
      }
      
      // 验证日志数量被限制
      const logs = getErrorLogs();
      expect(logs.length).toBeLessThanOrEqual(MAX_LOGS);
      
      // 验证最新的错误在前面
      expect(logs[0].message).toBe(`错误${MAX_LOGS + 2}`);
    });
  });
}); 