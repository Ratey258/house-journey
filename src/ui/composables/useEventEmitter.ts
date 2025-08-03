/**
 * 事件发射器 Composable
 * 基于依赖注入的事件系统访问层
 */
import { ref, inject, onMounted, onUnmounted, type Ref } from 'vue';
import type { DIContainer } from '../../infrastructure/di/container';

// 类型定义
interface EventListener {
  (data?: any): void;
}

interface UseEventEmitterReturn {
  // 状态
  isConnected: Ref<boolean>;
  
  // 方法
  emit: (eventName: string, data?: any) => void;
  on: (eventName: string, listener: EventListener) => void;
  off: (eventName: string, listener: EventListener) => void;
  once: (eventName: string, listener: EventListener) => void;
  
  // 便捷事件方法
  emitProductPurchased: (data: any) => void;
  emitProductSold: (data: any) => void;
  emitLocationChanged: (data: any) => void;
  emitMarketUpdated: (data: any) => void;
  
  // 生命周期方法
  registerListeners: (listeners: Record<string, EventListener>) => void;
  unregisterListeners: (listeners: Record<string, EventListener>) => void;
}

/**
 * 事件发射器 Composable
 * 通过依赖注入获取EventEmitter，提供类型安全的事件操作
 */
export function useEventEmitter(): UseEventEmitterReturn {
  // 通过依赖注入获取服务
  const container = inject<DIContainer>('diContainer');
  if (!container) {
    throw new Error('DI容器未正确配置。请确保在应用根部提供了diContainer。');
  }

  const eventEmitter = container.resolve('eventEmitter');
  
  // 响应式状态
  const isConnected = ref(true);
  
  // 存储注册的监听器，用于清理
  const registeredListeners = new Map<string, Set<EventListener>>();
  
  /**
   * 发射事件
   */
  const emit = (eventName: string, data?: any): void => {
    try {
      eventEmitter.emit(eventName, data);
    } catch (err) {
      console.error(`Failed to emit event ${eventName}:`, err);
      isConnected.value = false;
    }
  };

  /**
   * 监听事件
   */
  const on = (eventName: string, listener: EventListener): void => {
    try {
      eventEmitter.on(eventName, listener);
      
      // 记录监听器以便清理
      if (!registeredListeners.has(eventName)) {
        registeredListeners.set(eventName, new Set());
      }
      registeredListeners.get(eventName)!.add(listener);
      
    } catch (err) {
      console.error(`Failed to register listener for ${eventName}:`, err);
    }
  };

  /**
   * 取消监听事件
   */
  const off = (eventName: string, listener: EventListener): void => {
    try {
      eventEmitter.off(eventName, listener);
      
      // 从记录中移除
      const listeners = registeredListeners.get(eventName);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          registeredListeners.delete(eventName);
        }
      }
      
    } catch (err) {
      console.error(`Failed to unregister listener for ${eventName}:`, err);
    }
  };

  /**
   * 一次性监听事件
   */
  const once = (eventName: string, listener: EventListener): void => {
    const onceListener = (data?: any) => {
      listener(data);
      off(eventName, onceListener);
    };
    on(eventName, onceListener);
  };

  /**
   * 便捷事件发射方法
   */
  const emitProductPurchased = (data: any): void => {
    emit('PRODUCT_PURCHASED', data);
  };

  const emitProductSold = (data: any): void => {
    emit('PRODUCT_SOLD', data);
  };

  const emitLocationChanged = (data: any): void => {
    emit('LOCATION_CHANGED', data);
  };

  const emitMarketUpdated = (data: any): void => {
    emit('MARKET_UPDATED', data);
  };

  /**
   * 批量注册监听器
   */
  const registerListeners = (listeners: Record<string, EventListener>): void => {
    Object.entries(listeners).forEach(([eventName, listener]) => {
      on(eventName, listener);
    });
  };

  /**
   * 批量取消监听器
   */
  const unregisterListeners = (listeners: Record<string, EventListener>): void => {
    Object.entries(listeners).forEach(([eventName, listener]) => {
      off(eventName, listener);
    });
  };

  /**
   * 组件卸载时清理所有监听器
   */
  onUnmounted(() => {
    registeredListeners.forEach((listeners, eventName) => {
      listeners.forEach(listener => {
        try {
          eventEmitter.off(eventName, listener);
        } catch (err) {
          console.error(`Failed to cleanup listener for ${eventName}:`, err);
        }
      });
    });
    registeredListeners.clear();
  });

  return {
    // 状态
    isConnected,
    
    // 方法
    emit,
    on,
    off,
    once,
    
    // 便捷事件方法
    emitProductPurchased,
    emitProductSold,
    emitLocationChanged,
    emitMarketUpdated,
    
    // 生命周期方法
    registerListeners,
    unregisterListeners
  };
}