/**
 * 事件发射器 - TypeScript版本
 * 提供事件发布订阅功能
 */

import { handleError, ErrorType, ErrorSeverity } from './utils/errorHandler';

// ==================== 类型定义 ====================

/**
 * 事件监听器函数类型
 */
export type EventListener<T = any> = (data: T) => void;

/**
 * 取消订阅函数类型
 */
export type UnsubscribeFunction = () => void;

/**
 * 事件监听器映射类型
 */
type EventListenerMap = Record<string, EventListener[]>;

// ==================== 事件发射器类 ====================

/**
 * 事件发射器类
 * 提供类型安全的事件发布订阅功能
 */
export class EventEmitter {
  private events: EventListenerMap = {};
  private onceEvents: EventListenerMap = {};

  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param listener 监听函数
   * @returns 取消订阅函数
   */
  on<T = any>(eventName: string, listener: EventListener<T>): UnsubscribeFunction {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    
    this.events[eventName].push(listener);
    
    // 返回取消订阅函数
    return () => this.off(eventName, listener);
  }
  
  /**
   * 一次性订阅事件
   * @param eventName 事件名称
   * @param listener 监听函数
   * @returns 取消订阅函数
   */
  once<T = any>(eventName: string, listener: EventListener<T>): UnsubscribeFunction {
    if (!this.onceEvents[eventName]) {
      this.onceEvents[eventName] = [];
    }
    
    this.onceEvents[eventName].push(listener);
    
    // 返回取消订阅函数
    return () => {
      if (this.onceEvents[eventName]) {
        const index = this.onceEvents[eventName].indexOf(listener);
        if (index !== -1) {
          this.onceEvents[eventName].splice(index, 1);
        }
      }
    };
  }
  
  /**
   * 取消订阅事件
   * @param eventName 事件名称
   * @param listener 监听函数
   */
  off<T = any>(eventName: string, listener: EventListener<T>): void {
    if (this.events[eventName]) {
      const index = this.events[eventName].indexOf(listener);
      if (index !== -1) {
        this.events[eventName].splice(index, 1);
      }
    }
  }
  
  /**
   * 发射事件
   * @param eventName 事件名称
   * @param data 事件数据
   */
  emit<T = any>(eventName: string, ...args: T[]): void {
    // 处理常规事件
    if (this.events[eventName]) {
      this.events[eventName].forEach(listener => {
        try {
          // 如果有多个参数，传递第一个，保持向后兼容
          const data = args.length === 1 ? args[0] : args;
          listener(data);
        } catch (error) {
          handleError(error, `EventEmitter.emit(${eventName})`, ErrorType.SYSTEM, ErrorSeverity.WARNING);
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
    
    // 处理一次性事件
    if (this.onceEvents[eventName]) {
      const listeners = [...this.onceEvents[eventName]];
      this.onceEvents[eventName] = [];
      
      listeners.forEach(listener => {
        try {
          // 如果有多个参数，传递第一个，保持向后兼容
          const data = args.length === 1 ? args[0] : args;
          listener(data);
        } catch (error) {
          handleError(error, `EventEmitter.emit.once(${eventName})`, ErrorType.SYSTEM, ErrorSeverity.WARNING);
          console.error(`Error in once event listener for ${eventName}:`, error);
        }
      });
    }
  }
  
  /**
   * 移除指定事件的所有监听器
   * @param eventName 事件名称（可选）如果不提供，则清除所有事件
   */
  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.clearEvent(eventName);
    } else {
      this.clear();
    }
  }
  
  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.events = {};
    this.onceEvents = {};
  }
  
  /**
   * 清除特定事件的所有监听器
   * @param eventName 事件名称
   */
  clearEvent(eventName: string): void {
    if (eventName) {
      this.events[eventName] = [];
      this.onceEvents[eventName] = [];
    }
  }

  /**
   * 获取指定事件的监听器数量
   * @param eventName 事件名称
   * @returns 监听器数量
   */
  listenerCount(eventName: string): number {
    const regularCount = this.events[eventName]?.length || 0;
    const onceCount = this.onceEvents[eventName]?.length || 0;
    return regularCount + onceCount;
  }

  /**
   * 获取所有事件名称
   * @returns 事件名称数组
   */
  eventNames(): string[] {
    const regularEvents = Object.keys(this.events);
    const onceEvents = Object.keys(this.onceEvents);
    return [...new Set([...regularEvents, ...onceEvents])];
  }
}

// ==================== 全局实例 ====================

/**
 * 全局事件发射器实例
 */
const eventEmitter = new EventEmitter();

export default eventEmitter;

// ==================== 便捷函数导出 ====================

/**
 * 全局事件订阅
 */
export const on = eventEmitter.on.bind(eventEmitter);

/**
 * 全局一次性事件订阅
 */
export const once = eventEmitter.once.bind(eventEmitter);

/**
 * 全局事件取消订阅
 */
export const off = eventEmitter.off.bind(eventEmitter);

/**
 * 全局事件发射
 */
export const emit = eventEmitter.emit.bind(eventEmitter);

/**
 * 全局事件清理
 */
export const clearEvent = eventEmitter.clearEvent.bind(eventEmitter);