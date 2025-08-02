/**
 * 性能配置文件
 * 包含缓存、监控、优化等性能相关配置
 */

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  lruMaxSize: number;
  defaultTTL: number;
  memoryThreshold: number;
  cleanupInterval: number;
  maxCacheAge: number;
}

/**
 * 监控配置接口
 */
export interface MonitoringConfig {
  memoryMonitorInterval: number;
  performanceTrackingInterval: number;
  idleTimeout: number;
  realTimeTrackingInterval: number;
}

/**
 * 异步操作配置接口
 */
export interface AsyncConfig {
  defaultTimeout: number;
  maxRetries: number;
  retryDelay: number;
  concurrencyLimit: number;
}

/**
 * 性能配置接口
 */
export interface PerformanceConfig {
  cache: CacheConfig;
  monitoring: MonitoringConfig;
  async: AsyncConfig;
  ui: {
    animationDuration: number;
    debounceDelay: number;
    throttleDelay: number;
    lazyLoadThreshold: number;
  };
}

/**
 * 性能配置
 */
export const performanceConfig: PerformanceConfig = {
  // 缓存配置
  cache: {
    lruMaxSize: 1000,             // LRU缓存最大大小
    defaultTTL: 300000,           // 默认TTL: 5分钟
    memoryThreshold: 0.8,         // 内存使用阈值 (80%)
    cleanupInterval: 60000,       // 清理间隔: 1分钟
    maxCacheAge: 24 * 60 * 60 * 1000  // 最大缓存时间: 24小时
  },

  // 监控配置
  monitoring: {
    memoryMonitorInterval: 30000,     // 内存监控间隔: 30秒
    performanceTrackingInterval: 10000, // 性能跟踪间隔: 10秒
    idleTimeout: 300000,              // 空闲超时: 5分钟  
    realTimeTrackingInterval: 10000   // 实时跟踪间隔: 10秒
  },

  // 异步操作配置
  async: {
    defaultTimeout: 10000,        // 默认超时: 10秒
    maxRetries: 3,                // 最大重试次数
    retryDelay: 1000,             // 重试延迟: 1秒
    concurrencyLimit: 5           // 并发限制
  },

  // UI性能配置
  ui: {
    animationDuration: 300,       // 动画持续时间 (ms)
    debounceDelay: 300,           // 防抖延迟 (ms)
    throttleDelay: 1000,          // 节流延迟 (ms)
    lazyLoadThreshold: 100        // 懒加载阈值 (px)
  }
};

/**
 * 获取缓存配置
 */
export const getCacheConfig = (): CacheConfig => performanceConfig.cache;

/**
 * 获取监控配置
 */
export const getMonitoringConfig = (): MonitoringConfig => performanceConfig.monitoring;

/**
 * 获取异步配置
 */
export const getAsyncConfig = (): AsyncConfig => performanceConfig.async;