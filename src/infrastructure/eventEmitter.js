/**
 * 事件发射器
 * 提供事件发布订阅功能
 */
import { handleError, ErrorType, ErrorSeverity } from './utils/errorHandler';

/**
 * 事件发射器类
 */
export class EventEmitter {
  /**
   * 构造函数
   */
  constructor() {
    this.events = {};
    this.onceEvents = {};
  }
  
  /**
   * 订阅事件
   * @param {string} eventName 事件名称
   * @param {Function} listener 监听函数
   * @returns {Function} 取消订阅函数
   */
  on(eventName, listener) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    
    this.events[eventName].push(listener);
    
    // 返回取消订阅函数
    return () => this.off(eventName, listener);
  }
  
  /**
   * 一次性订阅事件
   * @param {string} eventName 事件名称
   * @param {Function} listener 监听函数
   * @returns {Function} 取消订阅函数
   */
  once(eventName, listener) {
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
   * @param {string} eventName 事件名称
   * @param {Function} listener 监听函数
   */
  off(eventName, listener) {
    if (this.events[eventName]) {
      const index = this.events[eventName].indexOf(listener);
      if (index !== -1) {
        this.events[eventName].splice(index, 1);
      }
    }
  }
  
  /**
   * 发射事件
   * @param {string} eventName 事件名称
   * @param {any} data 事件数据
   */
  emit(eventName, data) {
    // 处理常规事件
    if (this.events[eventName]) {
      this.events[eventName].forEach(listener => {
        try {
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
          listener(data);
        } catch (error) {
          handleError(error, `EventEmitter.emit.once(${eventName})`, ErrorType.SYSTEM, ErrorSeverity.WARNING);
          console.error(`Error in once event listener for ${eventName}:`, error);
        }
      });
    }
  }
  
  /**
   * 清除所有事件监听器
   */
  clear() {
    this.events = {};
    this.onceEvents = {};
  }
  
  /**
   * 清除特定事件的所有监听器
   * @param {string} eventName 事件名称
   */
  clearEvent(eventName) {
    if (eventName) {
      this.events[eventName] = [];
      this.onceEvents[eventName] = [];
    }
  }
}

// 创建全局事件发射器实例
const eventEmitter = new EventEmitter();

export default eventEmitter; 