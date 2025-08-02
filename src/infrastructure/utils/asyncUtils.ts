/**
 * 异步操作工具函数 - TypeScript版本
 * 提供超时处理、重试机制等异步操作增强功能
 */

/**
 * 为Promise添加超时处理
 * @param promise 需要添加超时的Promise
 * @param timeoutMs 超时时间（毫秒）
 * @param timeoutMessage 超时错误消息
 * @returns 带超时的Promise
 */
import { getAsyncConfig } from '../../config/performance.config';

export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = getAsyncConfig().defaultTimeout, 
  timeoutMessage: string = 'Operation timeout'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * 带重试机制的异步操作
 * @param asyncFn 异步函数
 * @param options 重试选项
 * @returns Promise
 */
export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
  timeoutMs?: number;
}

export async function withRetry<T>(
  asyncFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    timeoutMs = 10000
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const promise = asyncFn();
      return await withTimeout(promise, timeoutMs);
    } catch (error) {
      lastError = error as Error;
      
      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // 计算延迟时间（支持指数退避）
      const currentDelay = backoff ? delay * Math.pow(2, attempt) : delay;
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw lastError!;
}

/**
 * 并发执行多个异步操作，支持超时和限制并发数
 * @param tasks 异步任务数组
 * @param options 选项
 * @returns Promise数组结果
 */
export interface ConcurrentOptions {
  concurrency?: number;
  timeoutMs?: number;
  failFast?: boolean;
}

export async function concurrent<T>(
  tasks: Array<() => Promise<T>>,
  options: ConcurrentOptions = {}
): Promise<T[]> {
  const {
    concurrency = 5,
    timeoutMs = 10000,
    failFast = false
  } = options;

  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    
    const promise = withTimeout(task(), timeoutMs)
      .then(result => {
        results[i] = result;
      })
      .catch(error => {
        if (failFast) {
          throw error;
        }
        results[i] = error;
      });

    executing.push(promise);

    // 控制并发数
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  // 等待所有任务完成
  await Promise.all(executing);

  // 检查是否有错误（如果不是failFast模式）
  if (!failFast) {
    const errors = results.filter(result => result instanceof Error);
    if (errors.length > 0) {
      throw new Error(`${errors.length} tasks failed`);
    }
  }

  return results;
}

/**
 * 防抖异步函数
 * @param asyncFn 异步函数
 * @param delay 防抖延迟
 * @returns 防抖后的函数
 */
export function debounceAsync<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  delay: number = 300
): (...args: T) => Promise<R> {
  let timeoutId: NodeJS.Timeout | null = null;
  let resolveCallbacks: Array<(value: R) => void> = [];
  let rejectCallbacks: Array<(error: any) => void> = [];

  return (...args: T): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      resolveCallbacks.push(resolve);
      rejectCallbacks.push(reject);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        const currentResolvers = [...resolveCallbacks];
        const currentRejectors = [...rejectCallbacks];
        
        resolveCallbacks = [];
        rejectCallbacks = [];

        try {
          const result = await asyncFn(...args);
          currentResolvers.forEach(resolver => resolver(result));
        } catch (error) {
          currentRejectors.forEach(rejector => rejector(error));
        }
      }, delay);
    });
  };
}