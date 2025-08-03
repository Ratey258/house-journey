/**
 * 通用组合函数 (Composables)
 * 基于Vue 3.5 Composition API的通用功能组合函数
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick, type Ref } from 'vue';
import { useLocalStorage, useSessionStorage, useToggle, useCounter, useInterval } from '@vueuse/core';
import type { MaybeRef } from '@vueuse/core';

// === 本地存储组合函数 ===

/**
 * 使用本地存储 - 带类型安全和默认值
 */
export function useLocalStorageTyped<T>(
  key: string,
  defaultValue: T,
  options?: {
    serializer?: {
      read: (value: string) => T;
      write: (value: T) => string;
    };
  }
) {
  return useLocalStorage(key, defaultValue, options);
}

/**
 * 使用会话存储 - 带类型安全
 */
export function useSessionStorageTyped<T>(
  key: string,
  defaultValue: T,
  options?: {
    serializer?: {
      read: (value: string) => T;
      write: (value: T) => string;
    };
  }
) {
  return useSessionStorage(key, defaultValue, options);
}

// === 异步状态管理 ===

/**
 * 异步操作状态管理
 */
export function useAsyncState<T, P extends any[] = []>(
  asyncFn: (...args: P) => Promise<T>,
  initialState?: T
) {
  const data = ref<T | undefined>(initialState);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const execute = async (...args: P): Promise<T | undefined> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await asyncFn(...args);
      data.value = result;
      return result;
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    data.value = initialState;
    loading.value = false;
    error.value = null;
  };

  return {
    data: data as Ref<T | undefined>,
    loading: loading as Ref<boolean>,
    error: error as Ref<Error | null>,
    execute,
    reset
  };
}

// === 防抖和节流 ===

/**
 * 防抖函数组合函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: MaybeRef<number> = 300
) {
  const delayRef = ref(delay);
  let timeoutId: NodeJS.Timeout;

  const debouncedFn = (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayRef.value);
  };

  const cancel = () => {
    clearTimeout(timeoutId);
  };

  onUnmounted(() => {
    cancel();
  });

  return {
    debouncedFn,
    cancel
  };
}

/**
 * 节流函数组合函数
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: MaybeRef<number> = 300
) {
  const delayRef = ref(delay);
  let lastTime = 0;

  const throttledFn = (...args: Parameters<T>): void => {
    const now = Date.now();
    if (now - lastTime >= delayRef.value) {
      lastTime = now;
      fn(...args);
    }
  };

  return {
    throttledFn
  };
}

// === 表单处理 ===

/**
 * 表单验证组合函数
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validators: Partial<Record<keyof T, (value: any) => string | true>>
) {
  const values = ref<T>({ ...initialValues });
  const errors = ref<Partial<Record<keyof T, string>>>({});
  const touched = ref<Partial<Record<keyof T, boolean>>>({});

  const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
    values.value[field] = value;
    touched.value[field] = true;
    validateField(field);
  };

  const setFieldError = <K extends keyof T>(field: K, error: string) => {
    errors.value[field] = error;
  };

  const validateField = <K extends keyof T>(field: K) => {
    const validator = validators[field];
    if (validator) {
      const result = validator(values.value[field]);
      if (result === true) {
        delete errors.value[field];
      } else {
        errors.value[field] = result;
      }
    }
  };

  const validateAll = (): boolean => {
    let isValid = true;
    
    for (const field in validators) {
      validateField(field);
      if (errors.value[field]) {
        isValid = false;
      }
    }
    
    return isValid;
  };

  const reset = () => {
    values.value = { ...initialValues };
    errors.value = {};
    touched.value = {};
  };

  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0;
  });

  const isDirty = computed(() => {
    return Object.keys(touched.value).length > 0;
  });

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    setFieldValue,
    setFieldError,
    validateField,
    validateAll,
    reset
  };
}

// === 列表管理 ===

/**
 * 列表状态管理组合函数
 */
export function useList<T>(initialList: T[] = []) {
  const list = ref<T[]>([...initialList]);
  
  const add = (item: T) => {
    list.value.push(item);
  };

  const remove = (predicate: (item: T) => boolean) => {
    const index = list.value.findIndex(predicate);
    if (index !== -1) {
      list.value.splice(index, 1);
    }
  };

  const update = (predicate: (item: T) => boolean, updater: (item: T) => T) => {
    const index = list.value.findIndex(predicate);
    if (index !== -1) {
      list.value[index] = updater(list.value[index]);
    }
  };

  const clear = () => {
    list.value = [];
  };

  const reset = () => {
    list.value = [...initialList];
  };

  const find = (predicate: (item: T) => boolean) => {
    return list.value.find(predicate);
  };

  const filter = (predicate: (item: T) => boolean) => {
    return list.value.filter(predicate);
  };

  const sort = (compareFn?: (a: T, b: T) => number) => {
    list.value.sort(compareFn);
  };

  return {
    list,
    add,
    remove,
    update,
    clear,
    reset,
    find,
    filter,
    sort
  };
}

// === 分页管理 ===

/**
 * 分页组合函数
 */
export function usePagination(
  totalItems: MaybeRef<number>,
  itemsPerPage: MaybeRef<number> = 20
) {
  const currentPage = ref(1);
  const totalItemsRef = ref(totalItems);
  const itemsPerPageRef = ref(itemsPerPage);

  const totalPages = computed(() => {
    return Math.ceil(totalItemsRef.value / itemsPerPageRef.value);
  });

  const startIndex = computed(() => {
    return (currentPage.value - 1) * itemsPerPageRef.value;
  });

  const endIndex = computed(() => {
    return Math.min(startIndex.value + itemsPerPageRef.value, totalItemsRef.value);
  });

  const hasNext = computed(() => {
    return currentPage.value < totalPages.value;
  });

  const hasPrev = computed(() => {
    return currentPage.value > 1;
  });

  const next = () => {
    if (hasNext.value) {
      currentPage.value++;
    }
  };

  const prev = () => {
    if (hasPrev.value) {
      currentPage.value--;
    }
  };

  const goTo = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
    }
  };

  const reset = () => {
    currentPage.value = 1;
  };

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    hasNext,
    hasPrev,
    next,
    prev,
    goTo,
    reset
  };
}

// === 搜索和过滤 ===

/**
 * 搜索组合函数
 */
export function useSearch<T>(
  items: MaybeRef<T[]>,
  searchKeys: (keyof T)[],
  options: {
    caseSensitive?: boolean;
    debounceMs?: number;
  } = {}
) {
  const { caseSensitive = false, debounceMs = 300 } = options;
  const searchQuery = ref('');
  const itemsRef = ref(items);

  const filteredItems = ref<T[]>([]);

  const performSearch = () => {
    if (!searchQuery.value.trim()) {
      filteredItems.value = [...itemsRef.value];
      return;
    }

    const query = caseSensitive ? searchQuery.value : searchQuery.value.toLowerCase();
    
    filteredItems.value = itemsRef.value.filter(item => {
      return searchKeys.some(key => {
        const value = String(item[key]);
        const searchValue = caseSensitive ? value : value.toLowerCase();
        return searchValue.includes(query);
      });
    });
  };

  const { debouncedFn: debouncedSearch } = useDebounce(performSearch, debounceMs);

  watch(searchQuery, debouncedSearch, { immediate: true });
  watch(() => itemsRef.value, performSearch, { immediate: true });

  const clear = () => {
    searchQuery.value = '';
  };

  return {
    searchQuery,
    filteredItems,
    clear
  };
}

// === 模态框管理 ===

/**
 * 模态框组合函数
 */
export function useModal(initialOpen = false) {
  const { value: isOpen, toggle, set } = useToggle(initialOpen);

  const open = () => set(true);
  const close = () => set(false);

  // 锁定body滚动
  watch(isOpen, (newValue) => {
    if (typeof document !== 'undefined') {
      if (newValue) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  });

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  });

  return {
    isOpen,
    open,
    close,
    toggle
  };
}

// === 事件监听器 ===

/**
 * 事件监听器组合函数
 */
export function useEventListener<T extends Event>(
  target: EventTarget | null,
  event: string,
  handler: (event: T) => void,
  options?: AddEventListenerOptions
) {
  onMounted(() => {
    if (target) {
      target.addEventListener(event, handler as EventListener, options);
    }
  });

  onUnmounted(() => {
    if (target) {
      target.removeEventListener(event, handler as EventListener, options);
    }
  });
}

// === 键盘快捷键 ===

/**
 * 键盘快捷键组合函数
 */
export function useKeyboard(
  shortcuts: Record<string, () => void>
) {
  const handleKeydown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const modifiers = [];
    
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');
    
    const shortcut = [...modifiers, key].join('+');
    
    if (shortcuts[shortcut]) {
      event.preventDefault();
      shortcuts[shortcut]();
    }
  };

  useEventListener(document, 'keydown', handleKeydown);
}

// === 拖拽功能 ===

/**
 * 拖拽组合函数
 */
export function useDraggable(
  target: MaybeRef<HTMLElement | null>,
  options: {
    onStart?: (event: MouseEvent) => void;
    onMove?: (event: MouseEvent, deltaX: number, deltaY: number) => void;
    onEnd?: (event: MouseEvent) => void;
    handle?: MaybeRef<HTMLElement | null>;
  } = {}
) {
  const { onStart, onMove, onEnd, handle } = options;
  const isDragging = ref(false);
  let startX = 0;
  let startY = 0;

  const handleMouseDown = (e: MouseEvent) => {
    isDragging.value = true;
    startX = e.clientX;
    startY = e.clientY;
    
    onStart?.(e);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    onMove?.(e, deltaX, deltaY);
  };

  const handleMouseUp = (e: MouseEvent) => {
    isDragging.value = false;
    
    onEnd?.(e);
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  onMounted(() => {
    const element = handle ? ref(handle).value : ref(target).value;
    if (element) {
      element.addEventListener('mousedown', handleMouseDown);
    }
  });

  onUnmounted(() => {
    const element = handle ? ref(handle).value : ref(target).value;
    if (element) {
      element.removeEventListener('mousedown', handleMouseDown);
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  });

  return {
    isDragging
  };
}

// === 尺寸监听 ===

/**
 * 元素尺寸监听组合函数
 */
export function useElementSize(target: MaybeRef<HTMLElement | null>) {
  const width = ref(0);
  const height = ref(0);

  let resizeObserver: ResizeObserver | null = null;

  const observe = () => {
    const element = ref(target).value;
    if (!element || !window.ResizeObserver) return;

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        width.value = entry.contentRect.width;
        height.value = entry.contentRect.height;
      }
    });

    resizeObserver.observe(element);
  };

  const unobserve = () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  };

  onMounted(() => {
    nextTick(observe);
  });

  onUnmounted(() => {
    unobserve();
  });

  return {
    width,
    height,
    observe,
    unobserve
  };
}

// === 计时器 ===

/**
 * 倒计时组合函数
 */
export function useCountdown(
  initialTime: number,
  options: {
    onFinish?: () => void;
    onTick?: (remaining: number) => void;
  } = {}
) {
  const { onFinish, onTick } = options;
  const remaining = ref(initialTime);
  const isActive = ref(false);

  const { pause, resume, counter } = useInterval(1000, {
    controls: true,
    immediate: false,
    callback: () => {
      remaining.value--;
      onTick?.(remaining.value);
      
      if (remaining.value <= 0) {
        pause();
        isActive.value = false;
        onFinish?.();
      }
    }
  });

  const start = () => {
    if (remaining.value > 0) {
      isActive.value = true;
      resume();
    }
  };

  const stop = () => {
    isActive.value = false;
    pause();
  };

  const reset = (time = initialTime) => {
    stop();
    remaining.value = time;
  };

  return {
    remaining,
    isActive,
    start,
    stop,
    reset
  };
}

// 导出类型
export type AsyncState<T> = ReturnType<typeof useAsyncState<T>>;
export type FormValidation<T> = ReturnType<typeof useFormValidation<T>>;
export type ListState<T> = ReturnType<typeof useList<T>>;
export type PaginationState = ReturnType<typeof usePagination>;
export type SearchState<T> = ReturnType<typeof useSearch<T>>;
export type ModalState = ReturnType<typeof useModal>;
export type ElementSizeState = ReturnType<typeof useElementSize>;
export type CountdownState = ReturnType<typeof useCountdown>;