/**
 * 资源缓存管理 Composable
 * 优化静态资源缓存策略，提升加载性能
 */
import { ref, computed, onMounted, onBeforeUnmount, readonly, type Ref } from 'vue';
import { useSmartLogger } from '../../infrastructure/utils/smartLogger';

// 缓存配置接口
export interface CacheConfig {
  maxSize: number; // 最大缓存大小（字节）
  maxAge: number; // 最大缓存时间（毫秒）
  maxItems: number; // 最大缓存项数
  strategy: 'lru' | 'fifo' | 'lfu'; // 缓存策略
  compression: boolean; // 是否启用压缩
  persistent: boolean; // 是否持久化到localStorage
}

// 缓存项接口
export interface CacheItem {
  key: string;
  data: any;
  size: number;
  timestamp: number;
  lastAccess: number;
  accessCount: number;
  compressed: boolean;
  type: 'json' | 'text' | 'blob' | 'image' | 'script' | 'style';
  headers?: Record<string, string>;
  etag?: string;
}

// 缓存统计接口
export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  totalRequests: number;
  hits: number;
  misses: number;
  evictions: number;
  compressionRatio: number;
}

// HTTP缓存头信息
export interface CacheHeaders {
  cacheControl?: string;
  expires?: string;
  etag?: string;
  lastModified?: string;
  maxAge?: number;
}

// 默认配置
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxAge: 24 * 60 * 60 * 1000, // 24小时
  maxItems: 1000,
  strategy: 'lru',
  compression: true,
  persistent: true
};

export function useResourceCache(config: Partial<CacheConfig> = {}) {
  const logger = useSmartLogger();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 缓存存储
  const cache = new Map<string, CacheItem>();

  // 缓存统计
  const stats = ref<CacheStats>({
    totalItems: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    compressionRatio: 0
  });

  // 压缩工具
  const compressor = {
    async compress(data: string): Promise<string> {
      if (!finalConfig.compression) return data;

      try {
        // 使用简单的LZ77压缩（生产环境可考虑更强的压缩算法）
        const compressed = await compressString(data);
        return compressed;
      } catch (error) {
        logger.warn('压缩失败，使用原始数据', error);
        return data;
      }
    },

    async decompress(data: string): Promise<string> {
      if (!finalConfig.compression) return data;

      try {
        const decompressed = await decompressString(data);
        return decompressed;
      } catch (error) {
        logger.warn('解压缩失败，使用原始数据', error);
        return data;
      }
    }
  };

  // 简单的字符串压缩（实际项目中可使用更强的算法）
  const compressString = async (str: string): Promise<string> => {
    // 模拟压缩，实际可使用 pako.js 或其他压缩库
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    if ('CompressionStream' in window) {
      const cs = new CompressionStream('gzip');
      const writer = cs.writable.getWriter();
      const reader = cs.readable.getReader();

      writer.write(data);
      writer.close();

      const chunks: Uint8Array[] = [];
      let result = await reader.read();

      while (!result.done) {
        chunks.push(result.value);
        result = await reader.read();
      }

      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }

      return btoa(String.fromCharCode(...compressed));
    } else {
      // 回退到简单的重复字符压缩
      return str.replace(/(.)\1+/g, (match, char) => `${char}${match.length}`);
    }
  };

  // 简单的字符串解压缩
  const decompressString = async (str: string): Promise<string> => {
    if ('DecompressionStream' in window && str.match(/^[A-Za-z0-9+/=]+$/)) {
      try {
        const compressed = Uint8Array.from(atob(str), c => c.charCodeAt(0));
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();

        writer.write(compressed);
        writer.close();

        const chunks: Uint8Array[] = [];
        let result = await reader.read();

        while (!result.done) {
          chunks.push(result.value);
          result = await reader.read();
        }

        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }

        const decoder = new TextDecoder();
        return decoder.decode(decompressed);
      } catch (error) {
        logger.warn('gzip解压缩失败，尝试简单解压缩', error);
      }
    }

    // 回退到简单解压缩
    return str.replace(/(.)\d+/g, (match, char) => {
      const count = parseInt(match.slice(1));
      return char.repeat(count);
    });
  };

  // 获取缓存项
  const get = async (key: string): Promise<any> => {
    stats.value.totalRequests++;

    const item = cache.get(key);
    if (!item) {
      stats.value.misses++;
      updateHitRate();
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - item.timestamp > finalConfig.maxAge) {
      cache.delete(key);
      stats.value.misses++;
      stats.value.evictions++;
      updateHitRate();
      logger.info(`缓存项已过期: ${key}`);
      return null;
    }

    // 更新访问信息
    item.lastAccess = now;
    item.accessCount++;

    stats.value.hits++;
    updateHitRate();

    // 解压缩数据
    try {
      const data = item.compressed ?
        await compressor.decompress(item.data) :
        item.data;

      logger.info(`缓存命中: ${key}`);
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      logger.error(`缓存数据解析失败: ${key}`, error);
      cache.delete(key);
      return null;
    }
  };

  // 设置缓存项
  const set = async (
    key: string,
    data: any,
    options: {
      type?: CacheItem['type'];
      headers?: Record<string, string>;
      etag?: string;
      customTTL?: number;
    } = {}
  ): Promise<boolean> => {
    try {
      const serialized = typeof data === 'string' ? data : JSON.stringify(data);
      const compressed = await compressor.compress(serialized);
      const now = Date.now();

      const item: CacheItem = {
        key,
        data: compressed,
        size: new Blob([compressed]).size,
        timestamp: now,
        lastAccess: now,
        accessCount: 0,
        compressed: finalConfig.compression,
        type: options.type || 'json',
        headers: options.headers,
        etag: options.etag
      };

      // 检查缓存大小限制
      await ensureCapacity(item.size);

      // 添加到缓存
      cache.set(key, item);
      updateStats();

      // 持久化到localStorage（如果启用）
      if (finalConfig.persistent && item.size < 1024 * 1024) { // 限制1MB以下的项持久化
        try {
          localStorage.setItem(`cache_${key}`, JSON.stringify({
            data: item.data,
            timestamp: item.timestamp,
            type: item.type,
            compressed: item.compressed
          }));
        } catch (error) {
          logger.warn(`持久化缓存失败: ${key}`, error);
        }
      }

      logger.info(`缓存已设置: ${key} (${item.size} bytes)`);
      return true;
    } catch (error) {
      logger.error(`设置缓存失败: ${key}`, error);
      return false;
    }
  };

  // 确保缓存容量
  const ensureCapacity = async (newItemSize: number): Promise<void> => {
    // 检查项数限制
    while (cache.size >= finalConfig.maxItems) {
      await evictOne();
    }

    // 检查大小限制
    while (stats.value.totalSize + newItemSize > finalConfig.maxSize && cache.size > 0) {
      await evictOne();
    }
  };

  // 驱逐一个缓存项
  const evictOne = async (): Promise<void> => {
    if (cache.size === 0) return;

    let keyToEvict: string;
    const entries = Array.from(cache.entries());

    switch (finalConfig.strategy) {
      case 'lru':
        // 最近最少使用
        keyToEvict = entries.reduce((oldest, [key, item]) => {
          const oldestItem = cache.get(oldest[0]);
          return (!oldestItem || item.lastAccess < oldestItem.lastAccess) ? [key, item] : oldest;
        })[0];
        break;

      case 'lfu':
        // 最少使用频率
        keyToEvict = entries.reduce((least, [key, item]) => {
          const leastItem = cache.get(least[0]);
          return (!leastItem || item.accessCount < leastItem.accessCount) ? [key, item] : least;
        })[0];
        break;

      case 'fifo':
      default:
        // 先进先出
        keyToEvict = entries.reduce((oldest, [key, item]) => {
          const oldestItem = cache.get(oldest[0]);
          return (!oldestItem || item.timestamp < oldestItem.timestamp) ? [key, item] : oldest;
        })[0];
        break;
    }

    await remove(keyToEvict);
    stats.value.evictions++;
    logger.info(`驱逐缓存项: ${keyToEvict}`);
  };

  // 移除缓存项
  const remove = async (key: string): Promise<boolean> => {
    const item = cache.get(key);
    if (item) {
      cache.delete(key);

      // 从localStorage移除
      if (finalConfig.persistent) {
        try {
          localStorage.removeItem(`cache_${key}`);
        } catch (error) {
          logger.warn(`移除持久化缓存失败: ${key}`, error);
        }
      }

      updateStats();
      return true;
    }
    return false;
  };

  // 清空缓存
  const clear = async (): Promise<void> => {
    const keys = Array.from(cache.keys());
    cache.clear();

    // 清空localStorage中的缓存
    if (finalConfig.persistent) {
      keys.forEach(key => {
        try {
          localStorage.removeItem(`cache_${key}`);
        } catch (error) {
          logger.warn(`清空持久化缓存失败: ${key}`, error);
        }
      });
    }

    updateStats();
    logger.info('缓存已清空');
  };

  // 检查缓存是否存在
  const has = (key: string): boolean => {
    const item = cache.get(key);
    if (!item) return false;

    // 检查是否过期
    const now = Date.now();
    if (now - item.timestamp > finalConfig.maxAge) {
      cache.delete(key);
      return false;
    }

    return true;
  };

  // 更新统计信息
  const updateStats = (): void => {
    stats.value.totalItems = cache.size;
    stats.value.totalSize = Array.from(cache.values())
      .reduce((total, item) => total + item.size, 0);

    // 计算压缩比
    const compressedItems = Array.from(cache.values()).filter(item => item.compressed);
    if (compressedItems.length > 0) {
      const originalSize = compressedItems.reduce((total, item) => {
        // 估算原始大小（压缩项的数据长度通常比原始数据小）
        return total + item.size * 1.5; // 假设压缩率为67%
      }, 0);
      const compressedSize = compressedItems.reduce((total, item) => total + item.size, 0);
      stats.value.compressionRatio = compressedSize / originalSize;
    }
  };

  // 更新命中率
  const updateHitRate = (): void => {
    const total = stats.value.totalRequests;
    if (total > 0) {
      stats.value.hitRate = (stats.value.hits / total) * 100;
      stats.value.missRate = (stats.value.misses / total) * 100;
    }
  };

  // 获取所有缓存键
  const keys = (): string[] => {
    return Array.from(cache.keys());
  };

  // 获取缓存项信息
  const info = (key: string): CacheItem | null => {
    return cache.get(key) || null;
  };

  // 批量设置
  const setMany = async (items: Array<{ key: string; data: any; options?: any }>): Promise<number> => {
    let successCount = 0;

    for (const item of items) {
      const success = await set(item.key, item.data, item.options);
      if (success) successCount++;
    }

    logger.info(`批量设置缓存: ${successCount}/${items.length} 成功`);
    return successCount;
  };

  // 批量获取
  const getMany = async (keys: string[]): Promise<Record<string, any>> => {
    const result: Record<string, any> = {};

    for (const key of keys) {
      const data = await get(key);
      if (data !== null) {
        result[key] = data;
      }
    }

    return result;
  };

  // 从localStorage恢复缓存
  const restoreFromPersistent = async (): Promise<void> => {
    if (!finalConfig.persistent) return;

    let restoredCount = 0;
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_')) {
        try {
          const originalKey = key.slice(6); // 移除 'cache_' 前缀
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);

            // 检查是否过期
            if (now - parsed.timestamp <= finalConfig.maxAge) {
              const item: CacheItem = {
                key: originalKey,
                data: parsed.data,
                size: new Blob([parsed.data]).size,
                timestamp: parsed.timestamp,
                lastAccess: now,
                accessCount: 0,
                compressed: parsed.compressed || false,
                type: parsed.type || 'json'
              };

              cache.set(originalKey, item);
              restoredCount++;
            } else {
              // 删除过期的持久化缓存
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          logger.warn(`恢复持久化缓存失败: ${key}`, error);
        }
      }
    }

    if (restoredCount > 0) {
      updateStats();
      logger.info(`从持久化存储恢复 ${restoredCount} 个缓存项`);
    }
  };

  // 清理过期项
  const cleanupExpired = (): number => {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, item] of cache.entries()) {
      if (now - item.timestamp > finalConfig.maxAge) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => remove(key));

    if (keysToRemove.length > 0) {
      logger.info(`清理过期缓存项: ${keysToRemove.length} 个`);
    }

    return keysToRemove.length;
  };

  // 定期清理
  let cleanupTimer: NodeJS.Timeout;

  onMounted(async () => {
    // 恢复持久化缓存
    await restoreFromPersistent();

    // 设置定期清理
    cleanupTimer = setInterval(() => {
      cleanupExpired();
    }, 5 * 60 * 1000); // 每5分钟清理一次

    logger.info('资源缓存管理器已初始化', finalConfig);
  });

  onBeforeUnmount(() => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
    }
  });

  return {
    // 基本操作
    get,
    set,
    remove,
    clear,
    has,

    // 批量操作
    setMany,
    getMany,

    // 信息查询
    keys,
    info,
    stats: readonly(stats),

    // 维护操作
    cleanupExpired,
    restoreFromPersistent
  };
}
