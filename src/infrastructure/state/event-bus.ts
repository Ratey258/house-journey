/**
 * TypeScript事件总线系统
 * 提供类型安全的发布-订阅模式，减少store间直接依赖
 *
 * 🎯 v0.1.4新特性:
 * - 完整的TypeScript类型安全
 * - 异步事件处理支持
 * - Vue生命周期集成
 * - 智能日志系统集成
 * - 内存泄漏防护
 * - 性能监控和调试
 */

import { ref, onUnmounted, getCurrentInstance } from 'vue';
import { useSmartLogger } from '../utils/smartLogger';

/**
 * 游戏事件类型定义
 */
export interface GameEvents {
  // 玩家相关事件
  'player:money:changed': { amount: number; previousAmount: number; reason: string };
  'player:debt:changed': { amount: number; previousAmount: number };
  'player:level:up': { newLevel: number; oldLevel: number };
  'player:achievement:unlocked': { achievementId: string; title: string };

  // 市场相关事件
  'market:price:updated': { productId: string; newPrice: number; oldPrice: number; trend: string };
  'market:location:changed': { newLocation: string; oldLocation: string | null };
  'market:product:sold': { productId: string; quantity: number; totalPrice: number };
  'market:product:bought': { productId: string; quantity: number; totalPrice: number };

  // 游戏状态事件
  'game:week:advanced': { newWeek: number; oldWeek: number };
  'game:started': { playerName: string; initialMoney: number };
  'game:ended': { victory: boolean; finalWeek: number; finalNetWorth: number };
  'game:paused': { paused: boolean };

  // 房屋相关事件
  'house:purchased': { houseId: string; price: number; week: number };
  'house:sold': { houseId: string; salePrice: number; profit: number };

  // 系统事件
  'system:error': { error: Error; context: string; severity: string };
  'system:notification': { type: string; title: string; message: string };
  'system:performance:warning': { metric: string; value: number; threshold: number };

  // UI事件
  'ui:theme:changed': { theme: 'light' | 'dark' | 'auto' };
  'ui:toast:show': { type: string; message: string; duration?: number };
  'ui:modal:open': { modalId: string; data?: any };
  'ui:modal:close': { modalId: string };
}

/**
 * 事件监听器类型
 */
export type EventListener<T = any> = (payload: T) => void | Promise<void>;

/**
 * 事件监听器信息
 */
interface ListenerInfo<T = any> {
  callback: EventListener<T>;
  once: boolean;
  componentId?: string;
  timestamp: number;
}

/**
 * 事件统计信息
 */
interface EventStats {
  totalEmitted: number;
  totalListeners: number;
  lastEmitted: number;
  errorCount: number;
}

/**
 * TypeScript事件总线类
 * 实现类型安全的发布-订阅模式
 */
export class TypedEventBus {
  private _listeners = new Map<keyof GameEvents, ListenerInfo[]>();
  private _stats = new Map<keyof GameEvents, EventStats>();
  private _logger = useSmartLogger();
  private _isDestroyed = false;

  /**
   * 订阅事件
   */
  on<K extends keyof GameEvents>(
    event: K,
    callback: EventListener<GameEvents[K]>,
    options?: {
      componentId?: string;
      once?: boolean;
    }
  ): () => void {
    if (this._isDestroyed) {
      this._logger.warn('事件总线已销毁，无法注册监听器', { event });
      return () => {};
    }

    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
      this._stats.set(event, {
        totalEmitted: 0,
        totalListeners: 0,
        lastEmitted: 0,
        errorCount: 0
      });
    }

    const listeners = this._listeners.get(event)!;
    const stats = this._stats.get(event)!;

    const listenerInfo: ListenerInfo<GameEvents[K]> = {
      callback,
      once: options?.once || false,
      componentId: options?.componentId || this._getCurrentComponentId(),
      timestamp: Date.now()
    };

    listeners.push(listenerInfo);
    stats.totalListeners++;

    this._logger.debug('注册事件监听器', {
      event,
      listenersCount: listeners.length,
      componentId: listenerInfo.componentId,
      once: listenerInfo.once
    });

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 一次性订阅事件
   */
  once<K extends keyof GameEvents>(
    event: K,
    callback: EventListener<GameEvents[K]>,
    componentId?: string
  ): () => void {
    return this.on(event, callback, { once: true, componentId });
  }

  /**
   * 取消订阅事件
   */
  off<K extends keyof GameEvents>(
    event: K,
    callback: EventListener<GameEvents[K]>
  ): void {
    if (!this._listeners.has(event)) return;

    const listeners = this._listeners.get(event)!;
    const stats = this._stats.get(event)!;
    const initialLength = listeners.length;

    // 移除匹配的监听器
    for (let i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i].callback === callback) {
        listeners.splice(i, 1);
        stats.totalListeners--;
        break;
      }
    }

    const removedCount = initialLength - listeners.length;
    if (removedCount > 0) {
      this._logger.debug('移除事件监听器', {
        event,
        removedCount,
        remainingCount: listeners.length
      });
    }

    // 如果没有监听器了，清理事件
    if (listeners.length === 0) {
      this._listeners.delete(event);
      this._stats.delete(event);
    }
  }

  /**
   * 发布事件（同步）
   */
  emit<K extends keyof GameEvents>(
    event: K,
    payload: GameEvents[K]
  ): void {
    if (this._isDestroyed) {
      this._logger.warn('事件总线已销毁，无法发布事件', { event });
      return;
    }

    const startTime = performance.now();

    if (!this._listeners.has(event)) {
      this._logger.debug('没有监听器的事件', { event, payload });
      return;
    }

    const listeners = this._listeners.get(event)!;
    const stats = this._stats.get(event)!;

    // 更新统计信息
    stats.totalEmitted++;
    stats.lastEmitted = Date.now();

    this._logger.debug('发布事件', {
      event,
      listenersCount: listeners.length,
      payload
    });

    // 创建监听器副本以防回调中修改列表
    const listenersCopy = [...listeners];
    const onceListeners: ListenerInfo[] = [];

    // 执行所有监听器
    for (const listenerInfo of listenersCopy) {
      try {
        const result = listenerInfo.callback(payload);

        // 处理异步回调（记录但不等待）
        if (result instanceof Promise) {
          result.catch(error => {
            stats.errorCount++;
            this._logger.error('异步事件监听器错误', {
              event,
              error: error.message,
              componentId: listenerInfo.componentId
            });
          });
        }

        // 收集一次性监听器
        if (listenerInfo.once) {
          onceListeners.push(listenerInfo);
        }

      } catch (error) {
        stats.errorCount++;
        this._logger.error('事件监听器执行错误', {
          event,
          error: error.message,
          componentId: listenerInfo.componentId
        });
      }
    }

    // 移除一次性监听器
    if (onceListeners.length > 0) {
      const remainingListeners = listeners.filter(l => !onceListeners.includes(l));
      this._listeners.set(event, remainingListeners);
      stats.totalListeners -= onceListeners.length;

      this._logger.debug('移除一次性监听器', {
        event,
        removedCount: onceListeners.length,
        remainingCount: remainingListeners.length
      });
    }

    const duration = performance.now() - startTime;
    if (duration > 10) { // 超过10ms的事件发布记录性能警告
      this._logger.warn('事件发布耗时过长', {
        event,
        duration: `${duration.toFixed(2)}ms`,
        listenersCount: listenersCopy.length
      });
    }
  }

  /**
   * 发布异步事件（等待所有监听器完成）
   */
  async emitAsync<K extends keyof GameEvents>(
    event: K,
    payload: GameEvents[K]
  ): Promise<void> {
    if (this._isDestroyed) {
      this._logger.warn('事件总线已销毁，无法发布异步事件', { event });
      return;
    }

    const startTime = performance.now();

    if (!this._listeners.has(event)) {
      this._logger.debug('没有监听器的异步事件', { event, payload });
      return;
    }

    const listeners = this._listeners.get(event)!;
    const stats = this._stats.get(event)!;

    stats.totalEmitted++;
    stats.lastEmitted = Date.now();

    this._logger.debug('发布异步事件', {
      event,
      listenersCount: listeners.length,
      payload
    });

    const listenersCopy = [...listeners];
    const onceListeners: ListenerInfo[] = [];
    const promises: Promise<void>[] = [];

    // 执行所有监听器并收集Promise
    for (const listenerInfo of listenersCopy) {
      try {
        const result = listenerInfo.callback(payload);

        if (result instanceof Promise) {
          promises.push(
            result.catch(error => {
              stats.errorCount++;
              this._logger.error('异步事件监听器错误', {
                event,
                error: error.message,
                componentId: listenerInfo.componentId
              });
            })
          );
        }

        if (listenerInfo.once) {
          onceListeners.push(listenerInfo);
        }

      } catch (error) {
        stats.errorCount++;
        this._logger.error('异步事件监听器执行错误', {
          event,
          error: error.message,
          componentId: listenerInfo.componentId
        });
      }
    }

    // 等待所有Promise完成
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }

    // 移除一次性监听器
    if (onceListeners.length > 0) {
      const remainingListeners = listeners.filter(l => !onceListeners.includes(l));
      this._listeners.set(event, remainingListeners);
      stats.totalListeners -= onceListeners.length;
    }

    const duration = performance.now() - startTime;
    this._logger.debug('异步事件发布完成', {
      event,
      duration: `${duration.toFixed(2)}ms`,
      promiseCount: promises.length
    });
  }

  /**
   * 清除事件监听器
   */
  clear(event?: keyof GameEvents): void {
    if (event) {
      const listeners = this._listeners.get(event);
      if (listeners) {
        this._logger.debug('清除事件监听器', { event, count: listeners.length });
        this._listeners.delete(event);
        this._stats.delete(event);
      }
    } else {
      const totalListeners = Array.from(this._listeners.values())
        .reduce((sum, listeners) => sum + listeners.length, 0);

      this._logger.debug('清除所有事件监听器', { totalListeners });
      this._listeners.clear();
      this._stats.clear();
    }
  }

  /**
   * 清除组件相关的监听器
   */
  clearComponent(componentId: string): void {
    let totalRemoved = 0;

    for (const [event, listeners] in this._listeners.entries()) {
      const originalLength = listeners.length;
      const filteredListeners = listeners.filter(l => l.componentId !== componentId);

      if (filteredListeners.length !== originalLength) {
        const removedCount = originalLength - filteredListeners.length;
        totalRemoved += removedCount;

        if (filteredListeners.length === 0) {
          this._listeners.delete(event);
          this._stats.delete(event);
        } else {
          this._listeners.set(event, filteredListeners);
          const stats = this._stats.get(event);
          if (stats) {
            stats.totalListeners -= removedCount;
          }
        }
      }
    }

    if (totalRemoved > 0) {
      this._logger.debug('清除组件事件监听器', { componentId, removedCount: totalRemoved });
    }
  }

  /**
   * 获取事件统计信息
   */
  getStats(): Record<string, EventStats> {
    const stats: Record<string, EventStats> = {};
    for (const [event, eventStats] of this._stats.entries()) {
      stats[event as string] = { ...eventStats };
    }
    return stats;
  }

  /**
   * 获取当前监听器数量
   */
  getListenerCount(event?: keyof GameEvents): number {
    if (event) {
      return this._listeners.get(event)?.length || 0;
    }

    return Array.from(this._listeners.values())
      .reduce((sum, listeners) => sum + listeners.length, 0);
  }

  /**
   * 销毁事件总线
   */
  destroy(): void {
    this._logger.info('销毁事件总线', {
      totalEvents: this._listeners.size,
      totalListeners: this.getListenerCount()
    });

    this.clear();
    this._isDestroyed = true;
  }

  /**
   * 获取当前组件ID（用于自动清理）
   */
  private _getCurrentComponentId(): string | undefined {
    const instance = getCurrentInstance();
    return instance?.uid ? `component_${instance.uid}` : undefined;
  }
}

/**
 * 创建全局类型安全事件总线实例
 */
export const typedEventBus = new TypedEventBus();

/**
 * Vue Composable for 事件总线
 * 提供组件级的事件管理，自动清理
 */
export function useEventBus() {
  // 自动组件销毁时清理监听器
  if (getCurrentInstance()) {
    onUnmounted(() => {
      const componentId = typedEventBus['_getCurrentComponentId']?.();
      if (componentId) {
        typedEventBus.clearComponent(componentId);
      }
    });
  }

  return {
    on: typedEventBus.on.bind(typedEventBus),
    once: typedEventBus.once.bind(typedEventBus),
    off: typedEventBus.off.bind(typedEventBus),
    emit: typedEventBus.emit.bind(typedEventBus),
    emitAsync: typedEventBus.emitAsync.bind(typedEventBus),
    clear: typedEventBus.clear.bind(typedEventBus),
    getStats: typedEventBus.getStats.bind(typedEventBus),
    getListenerCount: typedEventBus.getListenerCount.bind(typedEventBus)
  };
}

// 保持向后兼容的默认导出
export default typedEventBus;

// 类型导出
export type { GameEvents, EventListener };
