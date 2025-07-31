/**
 * 事件总线
 * 提供状态管理之间的通信机制，减少直接依赖
 */

/**
 * 事件总线类
 * 实现发布-订阅模式，用于组件和状态之间的通信
 */
export class EventBus {
  /**
   * 构造函数
   */
  constructor() {
    this._listeners = new Map();
  }

  /**
   * 订阅事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   * @returns {Function} 取消订阅函数
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }

    const listeners = this._listeners.get(event);
    listeners.push(callback);

    return () => this.off(event, callback);
  }

  /**
   * 一次性订阅事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   * @returns {Function} 取消订阅函数
   */
  once(event, callback) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      callback(...args);
    };

    return this.on(event, onceWrapper);
  }

  /**
   * 取消订阅事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  off(event, callback) {
    if (!this._listeners.has(event)) return;

    const listeners = this._listeners.get(event);
    const index = listeners.indexOf(callback);

    if (index !== -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this._listeners.delete(event);
    }
  }

  /**
   * 发布事件
   * @param {string} event 事件名称
   * @param {...any} args 事件参数
   */
  emit(event, ...args) {
    if (!this._listeners.has(event)) return;

    const listeners = this._listeners.get(event);

    // 创建副本以防止回调中修改监听器列表
    const listenersCopy = [...listeners];

    for (const listener of listenersCopy) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    }
  }

  /**
   * 清除所有事件监听器
   * @param {string} [event] 事件名称，不提供则清除所有事件的监听器
   */
  clear(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }
}

// 创建全局事件总线实例
const eventBus = new EventBus();

export default eventBus;
