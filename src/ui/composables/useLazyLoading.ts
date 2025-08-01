/**
 * 懒加载和可见性检测 Composable
 * 实现图片懒加载，优化组件渲染性能
 */
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watch,
  nextTick,
  readonly,
  type Ref
} from 'vue';
import {
  useIntersectionObserver,
  useElementVisibility,
  useElementSize,
  useThrottleFn,
  useDebounceFn,
  useEventListener
} from '@vueuse/core';
import { useSmartLogger } from '../../infrastructure/utils/smartLogger';

// 懒加载配置接口
export interface LazyLoadConfig {
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
  placeholder?: string;
  errorImage?: string;
  loadingClass?: string;
  loadedClass?: string;
  errorClass?: string;
  delay?: number;
  retryCount?: number;
  retryDelay?: number;
}

// 图片懒加载状态
export interface ImageLoadState {
  loading: boolean;
  loaded: boolean;
  error: boolean;
  retries: number;
  loadTime?: number;
}

// 懒加载统计
export interface LazyLoadStats {
  totalImages: number;
  loadedImages: number;
  errorImages: number;
  averageLoadTime: number;
  totalBytes: number;
  cacheHits: number;
}

// 资源预加载队列项
export interface PreloadItem {
  url: string;
  priority: 'high' | 'medium' | 'low';
  type: 'image' | 'script' | 'style' | 'font';
  crossOrigin?: string;
  as?: string;
}

// 默认配置
const DEFAULT_CONFIG: Required<LazyLoadConfig> = {
  rootMargin: '50px',
  threshold: 0.1,
  once: true,
  placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJtIDAgMCBoIDIwIHYgMjAgaCAtMjAiIGZpbGw9IiNmNWY1ZjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=',
  errorImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=',
  loadingClass: 'lazy-loading',
  loadedClass: 'lazy-loaded',
  errorClass: 'lazy-error',
  delay: 0,
  retryCount: 3,
  retryDelay: 1000
};

export function useLazyLoading() {
  const logger = useSmartLogger();

  // 全局懒加载统计
  const stats = ref<LazyLoadStats>({
    totalImages: 0,
    loadedImages: 0,
    errorImages: 0,
    averageLoadTime: 0,
    totalBytes: 0,
    cacheHits: 0
  });

  // 图片缓存（使用Map提高查找性能）
  const imageCache = new Map<string, {
    url: string;
    blob: Blob;
    size: number;
    loadTime: number;
    lastAccess: number;
  }>();

  // 预加载队列
  const preloadQueue = ref<PreloadItem[]>([]);
  const isPreloading = ref(false);

  // IntersectionObserver实例缓存
  const observerCache = new Map<string, IntersectionObserver>();

  // 图片懒加载 Composable
  const useLazyImage = (
    src: Ref<string> | string,
    config: Partial<LazyLoadConfig> = {}
  ) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const imageRef = ref<HTMLImageElement | null>(null);
    const imageState = ref<ImageLoadState>({
      loading: false,
      loaded: false,
      error: false,
      retries: 0
    });

    const currentSrc = ref(finalConfig.placeholder);
    const actualSrc = computed(() => typeof src === 'string' ? src : src.value);

    // 使用交叉观察器检测元素可见性
    const { stop: stopObserver } = useIntersectionObserver(
      imageRef,
      ([{ isIntersecting }]) => {
        if (isIntersecting && !imageState.value.loaded && !imageState.value.loading) {
          loadImage();
          if (finalConfig.once) {
            stopObserver();
          }
        }
      },
      {
        rootMargin: finalConfig.rootMargin,
        threshold: finalConfig.threshold
      }
    );

    // 加载图片
    const loadImage = async (): Promise<void> => {
      const url = actualSrc.value;
      if (!url || imageState.value.loaded) return;

      imageState.value.loading = true;
      imageState.value.error = false;

      try {
        // 检查缓存
        const cached = imageCache.get(url);
        if (cached) {
          cached.lastAccess = Date.now();
          currentSrc.value = URL.createObjectURL(cached.blob);
          imageState.value.loaded = true;
          imageState.value.loading = false;
          imageState.value.loadTime = cached.loadTime;
          stats.value.cacheHits++;
          logger.info(`图片从缓存加载: ${url}`);
          return;
        }

        // 延迟加载（如果配置了延迟）
        if (finalConfig.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, finalConfig.delay));
        }

        // 预加载图片
        const startTime = Date.now();
        const blob = await preloadImageAsBlob(url);
        const loadTime = Date.now() - startTime;

        // 缓存图片
        imageCache.set(url, {
          url,
          blob,
          size: blob.size,
          loadTime,
          lastAccess: Date.now()
        });

        // 设置图片源
        currentSrc.value = URL.createObjectURL(blob);
        imageState.value.loaded = true;
        imageState.value.loading = false;
        imageState.value.loadTime = loadTime;

        // 更新统计
        stats.value.totalImages++;
        stats.value.loadedImages++;
        stats.value.totalBytes += blob.size;
        updateAverageLoadTime(loadTime);

        logger.info(`图片加载完成: ${url} (${blob.size} bytes, ${loadTime}ms)`);
      } catch (error) {
        await handleImageError(url, error as Error);
      }
    };

    // 处理图片加载错误
    const handleImageError = async (url: string, error: Error): Promise<void> => {
      imageState.value.retries++;

      if (imageState.value.retries <= finalConfig.retryCount) {
        logger.warn(`图片加载失败，重试 ${imageState.value.retries}/${finalConfig.retryCount}: ${url}`, error);

        // 延迟重试
        await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));

        try {
          await loadImage();
          return;
        } catch (retryError) {
          // 继续处理错误
        }
      }

      // 所有重试都失败
      logger.error(`图片加载彻底失败: ${url}`, error);
      currentSrc.value = finalConfig.errorImage;
      imageState.value.loading = false;
      imageState.value.error = true;
      stats.value.errorImages++;
    };

    // 预加载图片为Blob
    const preloadImageAsBlob = (url: string): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.ontimeout = () => reject(new Error('请求超时'));

        xhr.timeout = 10000; // 10秒超时
        xhr.send();
      });
    };

    // 计算CSS类
    const cssClasses = computed(() => {
      const classes: string[] = [];
      if (imageState.value.loading) classes.push(finalConfig.loadingClass);
      if (imageState.value.loaded) classes.push(finalConfig.loadedClass);
      if (imageState.value.error) classes.push(finalConfig.errorClass);
      return classes.join(' ');
    });

    // 清理资源
    const cleanup = (): void => {
      stopObserver();
      if (currentSrc.value.startsWith('blob:')) {
        URL.revokeObjectURL(currentSrc.value);
      }
    };

    // 重新加载
    const reload = (): void => {
      imageState.value = {
        loading: false,
        loaded: false,
        error: false,
        retries: 0
      };
      currentSrc.value = finalConfig.placeholder;
      loadImage();
    };

    onBeforeUnmount(cleanup);

    return {
      imageRef,
      currentSrc: readonly(currentSrc),
      imageState: readonly(imageState),
      cssClasses: readonly(cssClasses),
      reload,
      cleanup
    };
  };

  // 组件懒加载 Composable
  const useLazyComponent = (
    shouldLoad: Ref<boolean> | (() => boolean),
    config: { delay?: number; once?: boolean } = {}
  ) => {
    const isLoaded = ref(false);
    const isLoading = ref(false);
    const { delay = 0, once = true } = config;

    const checkShouldLoad = (): boolean => {
      return typeof shouldLoad === 'function' ? shouldLoad() : shouldLoad.value;
    };

    const load = async (): Promise<void> => {
      if (isLoaded.value || isLoading.value) return;

      isLoading.value = true;

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      isLoaded.value = true;
      isLoading.value = false;

      logger.info('懒加载组件已加载');
    };

    // 监听加载条件
    if (typeof shouldLoad !== 'function') {
      watch(shouldLoad, (newValue) => {
        if (newValue && (!once || !isLoaded.value)) {
          load();
        }
      }, { immediate: true });
    }

    return {
      isLoaded: readonly(isLoaded),
      isLoading: readonly(isLoading),
      load
    };
  };

  // 资源预加载
  const preloadResource = (item: PreloadItem): Promise<void> => {
    return new Promise((resolve, reject) => {
      let element: HTMLLinkElement | HTMLImageElement;

      if (item.type === 'image') {
        element = new Image() as HTMLImageElement;
        (element as HTMLImageElement).src = item.url;
        if (item.crossOrigin) {
          (element as HTMLImageElement).crossOrigin = item.crossOrigin;
        }
      } else {
        element = document.createElement('link');
        element.rel = 'preload';
        element.href = item.url;
        if (item.as) {
          element.as = item.as;
        }
        if (item.crossOrigin) {
          element.crossOrigin = item.crossOrigin;
        }
        document.head.appendChild(element);
      }

      element.onload = () => {
        logger.info(`预加载完成: ${item.url}`);
        resolve();
      };

      element.onerror = () => {
        logger.error(`预加载失败: ${item.url}`);
        reject(new Error(`预加载失败: ${item.url}`));
      };

      // 图片直接开始加载，link标签添加到head后开始加载
    });
  };

  // 批量预加载
  const batchPreload = async (items: PreloadItem[]): Promise<void> => {
    if (isPreloading.value) {
      logger.warn('预加载正在进行中，忽略新的预加载请求');
      return;
    }

    isPreloading.value = true;
    preloadQueue.value = [...items].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    logger.info(`开始批量预加载 ${items.length} 个资源`);

    try {
      // 并发加载，但限制并发数
      const concurrency = 3;
      const chunks: PreloadItem[][] = [];
      for (let i = 0; i < preloadQueue.value.length; i += concurrency) {
        chunks.push(preloadQueue.value.slice(i, i + concurrency));
      }

      for (const chunk of chunks) {
        await Promise.allSettled(chunk.map(preloadResource));
      }

      logger.info('批量预加载完成');
    } catch (error) {
      logger.error('批量预加载失败', error);
    } finally {
      isPreloading.value = false;
      preloadQueue.value = [];
    }
  };

  // 清理图片缓存
  const cleanupImageCache = (maxAge: number = 24 * 60 * 60 * 1000): void => {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [url, cache] of imageCache.entries()) {
      if (now - cache.lastAccess > maxAge) {
        URL.revokeObjectURL(cache.url);
        imageCache.delete(url);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`清理图片缓存: ${cleanedCount} 项`);
    }
  };

  // 更新平均加载时间
  const updateAverageLoadTime = (newLoadTime: number): void => {
    const totalTime = stats.value.averageLoadTime * (stats.value.loadedImages - 1) + newLoadTime;
    stats.value.averageLoadTime = totalTime / stats.value.loadedImages;
  };

  // 获取缓存统计
  const getCacheStats = () => {
    const cacheSize = Array.from(imageCache.values())
      .reduce((total, cache) => total + cache.size, 0);

    return {
      count: imageCache.size,
      totalSize: cacheSize,
      averageSize: imageCache.size > 0 ? cacheSize / imageCache.size : 0
    };
  };

  // 优化性能的节流函数
  const throttledCleanup = useThrottleFn(cleanupImageCache, 60000); // 每分钟最多清理一次

  // 定期清理缓存
  onMounted(() => {
    // 每10分钟清理一次缓存
    const cleanupInterval = setInterval(() => {
      throttledCleanup();
    }, 10 * 60 * 1000);

    onBeforeUnmount(() => {
      clearInterval(cleanupInterval);
      // 清理所有blob URL
      for (const [, cache] of imageCache) {
        if (cache.url.startsWith('blob:')) {
          URL.revokeObjectURL(cache.url);
        }
      }
      imageCache.clear();
    });
  });

  return {
    // 图片懒加载
    useLazyImage,

    // 组件懒加载
    useLazyComponent,

    // 资源预加载
    preloadResource,
    batchPreload,

    // 缓存管理
    cleanupImageCache,
    getCacheStats,

    // 统计信息
    stats: readonly(stats),
    preloadQueue: readonly(preloadQueue),
    isPreloading: readonly(isPreloading)
  };
}
