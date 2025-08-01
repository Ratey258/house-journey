/**
 * 内存管理优化 Composable
 * 使用WeakMap/WeakSet优化引用，实现组件销毁时的清理机制，优化大型对象存储策略
 */
import {
  ref,
  onBeforeUnmount,
  onMounted,
  watch,
  computed,
  readonly,
  type Ref
} from 'vue';
import { useSmartLogger } from '../../infrastructure/utils/smartLogger';

// 内存使用统计接口
export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercent: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastMeasurement: number;
}

// 内存清理任务接口
export interface CleanupTask {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high';
  cleanup: () => void | Promise<void>;
  autoRun: boolean;
  interval?: number;
}

// 缓存策略接口
export interface CacheStrategy {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  cleanup: 'lru' | 'fifo' | 'manual';
}

// 内存警告接口
export interface MemoryWarning {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  threshold: number;
  currentUsage: number;
  timestamp: number;
  resolved: boolean;
}

export function useMemoryManager() {
  const logger = useSmartLogger();

  // 内存统计
  const memoryStats = ref<MemoryStats>({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    usagePercent: 0,
    trend: 'stable',
    lastMeasurement: Date.now()
  });

  // 清理任务注册表
  const cleanupTasks = new Map<string, CleanupTask>();

  // WeakMap缓存，自动垃圾回收
  const weakCaches = new Map<string, WeakMap<object, any>>();

  // WeakSet引用跟踪，自动垃圾回收
  const weakReferences = new Map<string, WeakSet<object>>();

  // 普通缓存（带TTL和大小限制）
  const managedCaches = new Map<string, Map<string, { value: any; expiry: number; accessTime: number }>>();

  // 内存警告
  const memoryWarnings = ref<MemoryWarning[]>([]);

  // 大型对象存储（使用IndexedDB或其他持久化存储）
  const largeObjectStorage = new Map<string, {
    key: string;
    size: number;
    lastAccess: number;
    persisted: boolean;
  }>();

  // 定时器和监听器注册表
  const timers = new Set<number>();
  const intervals = new Set<number>();
  const eventListeners = new Map<EventTarget, Map<string, EventListener>>();

  // 内存监控间隔
  let monitoringInterval: NodeJS.Timeout | null = null;

  // 获取当前内存使用情况
  const getCurrentMemoryUsage = (): MemoryStats => {
    if (!('memory' in performance)) {
      // 浏览器不支持memory API
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usagePercent: 0,
        trend: 'stable',
        lastMeasurement: Date.now()
      };
    }

    const memory = (performance as any).memory;
    const previous = memoryStats.value;
    const current = Date.now();

    // 计算趋势
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (previous.usedJSHeapSize > 0) {
      const diff = memory.usedJSHeapSize - previous.usedJSHeapSize;
      const threshold = previous.usedJSHeapSize * 0.05; // 5% threshold

      if (diff > threshold) trend = 'increasing';
      else if (diff < -threshold) trend = 'decreasing';
    }

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      trend,
      lastMeasurement: current
    };
  };

  // 创建WeakMap缓存
  const createWeakCache = <K extends object, V>(name: string): WeakMap<K, V> => {
    const cache = new WeakMap<K, V>();
    weakCaches.set(name, cache);
    logger.info(`创建WeakMap缓存: ${name}`);
    return cache;
  };

  // 创建WeakSet引用跟踪
  const createWeakSet = <T extends object>(name: string): WeakSet<T> => {
    const set = new WeakSet<T>();
    weakReferences.set(name, set);
    logger.info(`创建WeakSet引用跟踪: ${name}`);
    return set;
  };

  // 创建受管理的缓存
  const createManagedCache = (name: string, strategy: CacheStrategy): void => {
    const cache = new Map<string, { value: any; expiry: number; accessTime: number }>();
    managedCaches.set(name, cache);

    // 自动清理过期项
    if (strategy.cleanup === 'lru' || strategy.cleanup === 'fifo') {
      registerCleanupTask({
        id: `cache-cleanup-${name}`,
        name: `清理缓存: ${name}`,
        priority: 'medium',
        cleanup: () => cleanupManagedCache(name, strategy),
        autoRun: true,
        interval: Math.min(strategy.ttl / 2, 60000) // 每半个TTL或最多1分钟清理一次
      });
    }

    logger.info(`创建受管理缓存: ${name}`, strategy);
  };

  // 清理受管理的缓存
  const cleanupManagedCache = (name: string, strategy: CacheStrategy): void => {
    const cache = managedCaches.get(name);
    if (!cache) return;

    const now = Date.now();
    const entries = Array.from(cache.entries());
    const toRemove: string[] = [];

    // 清理过期项
    entries.forEach(([key, item]) => {
      if (now > item.expiry) {
        toRemove.push(key);
      }
    });

    // 根据策略清理超出大小限制的项
    if (cache.size - toRemove.length > strategy.maxSize) {
      const excess = cache.size - toRemove.length - strategy.maxSize;
      const validEntries = entries.filter(([key]) => !toRemove.includes(key));

      if (strategy.cleanup === 'lru') {
        // 最近最少使用
        validEntries.sort((a, b) => a[1].accessTime - b[1].accessTime);
      } else if (strategy.cleanup === 'fifo') {
        // 先进先出（按expiry时间排序）
        validEntries.sort((a, b) => a[1].expiry - b[1].expiry);
      }

      validEntries.slice(0, excess).forEach(([key]) => {
        toRemove.push(key);
      });
    }

    // 执行删除
    toRemove.forEach(key => cache.delete(key));

    if (toRemove.length > 0) {
      logger.info(`清理缓存 ${name}: 删除 ${toRemove.length} 项`);
    }
  };

  // 设置缓存项
  const setCacheItem = (cacheName: string, key: string, value: any, customTTL?: number): void => {
    const cache = managedCaches.get(cacheName);
    if (!cache) {
      logger.warn(`缓存不存在: ${cacheName}`);
      return;
    }

    const now = Date.now();
    const ttl = customTTL || 300000; // 默认5分钟TTL

    cache.set(key, {
      value,
      expiry: now + ttl,
      accessTime: now
    });
  };

  // 获取缓存项
  const getCacheItem = (cacheName: string, key: string): any => {
    const cache = managedCaches.get(cacheName);
    if (!cache) return undefined;

    const item = cache.get(key);
    if (!item) return undefined;

    const now = Date.now();

    // 检查是否过期
    if (now > item.expiry) {
      cache.delete(key);
      return undefined;
    }

    // 更新访问时间（用于LRU）
    item.accessTime = now;
    return item.value;
  };

  // 注册清理任务
  const registerCleanupTask = (task: CleanupTask): void => {
    cleanupTasks.set(task.id, task);

    // 如果是自动运行且有间隔，设置定时器
    if (task.autoRun && task.interval) {
      const intervalId = window.setInterval(async () => {
        try {
          await task.cleanup();
        } catch (error) {
          logger.error(`清理任务失败: ${task.name}`, error);
        }
      }, task.interval);

      intervals.add(intervalId);
    }

    logger.info(`注册清理任务: ${task.name}`);
  };

  // 执行清理任务
  const executeCleanupTask = async (taskId: string): Promise<void> => {
    const task = cleanupTasks.get(taskId);
    if (!task) {
      logger.warn(`清理任务不存在: ${taskId}`);
      return;
    }

    try {
      await task.cleanup();
      logger.info(`执行清理任务: ${task.name}`);
    } catch (error) {
      logger.error(`清理任务执行失败: ${task.name}`, error);
    }
  };

  // 安全注册定时器
  const safeSetTimeout = (callback: Function, delay: number): number => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      callback();
    }, delay);

    timers.add(id);
    return id;
  };

  // 安全注册间隔定时器
  const safeSetInterval = (callback: Function, interval: number): number => {
    const id = window.setInterval(callback, interval);
    intervals.add(id);
    return id;
  };

  // 安全注册事件监听器
  const safeAddEventListener = (
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void => {
    target.addEventListener(type, listener, options);

    if (!eventListeners.has(target)) {
      eventListeners.set(target, new Map());
    }

    const targetListeners = eventListeners.get(target)!;
    targetListeners.set(type, listener);
  };

  // 存储大型对象到持久化存储
  const storeLargeObject = async (key: string, object: any): Promise<boolean> => {
    try {
      const serialized = JSON.stringify(object);
      const size = new Blob([serialized]).size;

      // 如果对象太大（>50MB），使用IndexedDB
      if (size > 50 * 1024 * 1024) {
        // 这里应该使用IndexedDB，简化为localStorage示例
        logger.warn(`对象过大 (${size} bytes)，建议使用IndexedDB`);
        return false;
      }

      // 存储到localStorage（生产环境应使用IndexedDB）
      localStorage.setItem(`large_object_${key}`, serialized);

      largeObjectStorage.set(key, {
        key,
        size,
        lastAccess: Date.now(),
        persisted: true
      });

      logger.info(`存储大型对象: ${key} (${size} bytes)`);
      return true;
    } catch (error) {
      logger.error(`存储大型对象失败: ${key}`, error);
      return false;
    }
  };

  // 从持久化存储加载大型对象
  const loadLargeObject = async (key: string): Promise<any> => {
    try {
      const stored = localStorage.getItem(`large_object_${key}`);
      if (!stored) return null;

      const object = JSON.parse(stored);

      // 更新访问时间
      const info = largeObjectStorage.get(key);
      if (info) {
        info.lastAccess = Date.now();
      }

      logger.info(`加载大型对象: ${key}`);
      return object;
    } catch (error) {
      logger.error(`加载大型对象失败: ${key}`, error);
      return null;
    }
  };

  // 检查内存警告
  const checkMemoryWarnings = (): void => {
    const current = memoryStats.value;
    const now = Date.now();

    // 清理已解决的警告
    memoryWarnings.value = memoryWarnings.value.filter(warning =>
      !warning.resolved && (now - warning.timestamp) < 300000 // 5分钟内的警告
    );

    // 检查内存使用阈值
    const warnings: MemoryWarning[] = [];

    if (current.usagePercent > 85) {
      warnings.push({
        id: `memory-critical-${now}`,
        type: 'critical',
        message: '内存使用率超过85%，系统可能变慢',
        threshold: 85,
        currentUsage: current.usagePercent,
        timestamp: now,
        resolved: false
      });
    } else if (current.usagePercent > 70) {
      warnings.push({
        id: `memory-warning-${now}`,
        type: 'warning',
        message: '内存使用率超过70%，建议清理缓存',
        threshold: 70,
        currentUsage: current.usagePercent,
        timestamp: now,
        resolved: false
      });
    }

    // 检查内存增长趋势
    if (current.trend === 'increasing' && current.usagePercent > 60) {
      warnings.push({
        id: `memory-trend-${now}`,
        type: 'warning',
        message: '内存使用持续增长，可能存在内存泄漏',
        threshold: 60,
        currentUsage: current.usagePercent,
        timestamp: now,
        resolved: false
      });
    }

    // 添加新警告
    warnings.forEach(warning => {
      const exists = memoryWarnings.value.some(w =>
        w.type === warning.type && Math.abs(w.timestamp - warning.timestamp) < 30000
      );

      if (!exists) {
        memoryWarnings.value.push(warning);
        logger.warn(`内存警告: ${warning.message}`, {
          threshold: warning.threshold,
          current: warning.currentUsage
        });
      }
    });
  };

  // 执行紧急内存清理
  const performEmergencyCleanup = async (): Promise<void> => {
    logger.warn('执行紧急内存清理');

    // 1. 清理所有缓存
    managedCaches.forEach((cache, name) => {
      const size = cache.size;
      cache.clear();
      logger.info(`清空缓存: ${name} (${size} 项)`);
    });

    // 2. 执行所有高优先级清理任务
    const highPriorityTasks = Array.from(cleanupTasks.values())
      .filter(task => task.priority === 'high');

    for (const task of highPriorityTasks) {
      try {
        await task.cleanup();
      } catch (error) {
        logger.error(`紧急清理任务失败: ${task.name}`, error);
      }
    }

    // 3. 触发垃圾回收（如果支持）
    if (window.gc) {
      window.gc();
      logger.info('手动触发垃圾回收');
    }

    // 4. 清理大型对象存储中的旧项
    const now = Date.now();
    const oldThreshold = 24 * 60 * 60 * 1000; // 24小时

    Array.from(largeObjectStorage.entries()).forEach(([key, info]) => {
      if (now - info.lastAccess > oldThreshold) {
        localStorage.removeItem(`large_object_${key}`);
        largeObjectStorage.delete(key);
        logger.info(`清理旧的大型对象: ${key}`);
      }
    });

    logger.info('紧急内存清理完成');
  };

  // 全面内存清理
  const cleanup = async (): Promise<void> => {
    logger.info('开始内存管理清理');

    // 清理定时器
    timers.forEach(id => {
      clearTimeout(id);
    });
    timers.clear();

    intervals.forEach(id => {
      clearInterval(id);
    });
    intervals.clear();

    // 清理事件监听器
    eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, type) => {
        target.removeEventListener(type, listener);
      });
    });
    eventListeners.clear();

    // 停止内存监控
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }

    // 执行所有清理任务
    const allTasks = Array.from(cleanupTasks.values());
    for (const task of allTasks) {
      try {
        await task.cleanup();
      } catch (error) {
        logger.error(`清理任务失败: ${task.name}`, error);
      }
    }

    // 清空缓存
    managedCaches.clear();
    weakCaches.clear();
    weakReferences.clear();

    logger.info('内存管理清理完成');
  };

  // 内存使用统计
  const memoryUsageStats = computed(() => ({
    current: memoryStats.value,
    caches: {
      weakCaches: weakCaches.size,
      managedCaches: managedCaches.size,
      totalCacheItems: Array.from(managedCaches.values())
        .reduce((sum, cache) => sum + cache.size, 0)
    },
    cleanup: {
      totalTasks: cleanupTasks.size,
      activeTimers: timers.size,
      activeIntervals: intervals.size,
      eventListeners: Array.from(eventListeners.values())
        .reduce((sum, listeners) => sum + listeners.size, 0)
    },
    storage: {
      largeObjects: largeObjectStorage.size,
      totalStorageSize: Array.from(largeObjectStorage.values())
        .reduce((sum, info) => sum + info.size, 0)
    }
  }));

  // 启动内存监控
  const startMemoryMonitoring = (interval: number = 30000): void => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }

    monitoringInterval = setInterval(() => {
      memoryStats.value = getCurrentMemoryUsage();
      checkMemoryWarnings();

      // 如果内存使用率过高，执行自动清理
      if (memoryStats.value.usagePercent > 90) {
        performEmergencyCleanup();
      }
    }, interval);

    logger.info(`启动内存监控，间隔: ${interval}ms`);
  };

  // 初始化
  onMounted(() => {
    // 立即获取内存使用情况
    memoryStats.value = getCurrentMemoryUsage();

    // 启动内存监控
    startMemoryMonitoring();

    // 注册基础清理任务
    registerCleanupTask({
      id: 'memory-stats-cleanup',
      name: '内存统计清理',
      priority: 'low',
      cleanup: () => {
        // 清理旧的内存警告
        const now = Date.now();
        memoryWarnings.value = memoryWarnings.value.filter(w =>
          (now - w.timestamp) < 600000 // 保留10分钟内的警告
        );
      },
      autoRun: true,
      interval: 120000 // 每2分钟清理一次
    });

    logger.info('内存管理器已初始化');
  });

  // 组件卸载时清理
  onBeforeUnmount(() => {
    cleanup();
  });

  return {
    // 内存统计
    memoryStats: readonly(memoryStats),
    memoryUsageStats: readonly(memoryUsageStats),
    memoryWarnings: readonly(memoryWarnings),

    // 缓存管理
    createWeakCache,
    createWeakSet,
    createManagedCache,
    setCacheItem,
    getCacheItem,

    // 清理任务管理
    registerCleanupTask,
    executeCleanupTask,

    // 安全的定时器和事件监听器
    safeSetTimeout,
    safeSetInterval,
    safeAddEventListener,

    // 大型对象存储
    storeLargeObject,
    loadLargeObject,

    // 内存管理
    performEmergencyCleanup,
    startMemoryMonitoring,
    cleanup
  };
}
