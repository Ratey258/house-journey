/**
 * Vue相关类型定义
 * 扩展Vue 3.5的类型系统
 */

import type { App, Component, DefineComponent, Ref, ComputedRef, UnwrapRef } from 'vue';
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router';
import type { Store } from 'pinia';

// === Vue应用类型 ===
export interface VueAppInstance extends App {
  config: {
    globalProperties: Record<string, any>;
    errorHandler?: (err: unknown, instance: Component | null, info: string) => void;
    warnHandler?: (msg: string, instance: Component | null, trace: string) => void;
  };
}

// === 组件类型 ===
export type VueComponent<P = {}> = DefineComponent<P>;

export interface ComponentOptions {
  name?: string;
  inheritAttrs?: boolean;
  props?: Record<string, any>;
  emits?: string[] | Record<string, any>;
  expose?: string[];
}

// === 组合式API类型 ===
export type ComposableFunction<T = any, P extends any[] = []> = (...args: P) => T;

export interface UseAsyncReturn<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  execute: (...args: any[]) => Promise<T>;
  refresh: () => Promise<T>;
}

export interface UseFormReturn<T extends Record<string, any>> {
  values: Ref<T>;
  errors: Ref<Partial<Record<keyof T, string>>>;
  isValid: ComputedRef<boolean>;
  isSubmitting: Ref<boolean>;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: <K extends keyof T>(field: K, error: string) => void;
  clearErrors: () => void;
  reset: () => void;
  submit: () => Promise<boolean>;
}

// === Store类型 ===
export interface StoreDefinition<T = any> {
  id: string;
  state?: () => T;
  getters?: Record<string, any>;
  actions?: Record<string, any>;
}

export type StoreInstance<T> = Store<string, T>;

// === 路由类型 ===
export interface RouteConfig {
  path: string;
  name?: string;
  component: Component;
  props?: boolean | Record<string, any>;
  meta?: Record<string, any>;
  children?: RouteConfig[];
}

export interface NavigationGuard {
  (to: RouteLocationNormalizedLoaded, from: RouteLocationNormalizedLoaded): 
    boolean | void | string | Promise<boolean | void | string>;
}

// === 插件类型 ===
export interface VuePlugin {
  install(app: App, options?: any): void;
}

export type PluginInstallFunction = (app: App, options?: any) => void;

// === 指令类型 ===
export interface DirectiveBinding<T = any> {
  value: T;
  oldValue: T;
  arg?: string;
  modifiers: Record<string, boolean>;
  instance: Component | null;
  dir: ObjectDirective<any, T>;
}

export interface ObjectDirective<T = HTMLElement, V = any> {
  created?: (el: T, binding: DirectiveBinding<V>) => void;
  beforeMount?: (el: T, binding: DirectiveBinding<V>) => void;
  mounted?: (el: T, binding: DirectiveBinding<V>) => void;
  beforeUpdate?: (el: T, binding: DirectiveBinding<V>) => void;
  updated?: (el: T, binding: DirectiveBinding<V>) => void;
  beforeUnmount?: (el: T, binding: DirectiveBinding<V>) => void;
  unmounted?: (el: T, binding: DirectiveBinding<V>) => void;
}

// === 事件类型 ===
export interface ComponentEmits {
  [event: string]: (...args: any[]) => void;
}

export type EmitFunction<T extends ComponentEmits> = <K extends keyof T>(
  event: K,
  ...args: Parameters<T[K]>
) => void;

// === Props类型 ===
export interface PropDefinition<T = any> {
  type?: PropType<T>;
  required?: boolean;
  default?: T | (() => T);
  validator?: (value: T) => boolean;
}

export type PropType<T> = T extends string
  ? StringConstructor
  : T extends number
  ? NumberConstructor
  : T extends boolean
  ? BooleanConstructor
  : T extends Array<any>
  ? ArrayConstructor
  : T extends object
  ? ObjectConstructor
  : any;

export type PropsDefinition<T = {}> = {
  [K in keyof T]: PropDefinition<T[K]>;
};

// === 生命周期类型 ===
export type LifecycleHook = () => void | Promise<void>;

export interface ComponentLifecycle {
  onBeforeMount?: LifecycleHook;
  onMounted?: LifecycleHook;
  onBeforeUpdate?: LifecycleHook;
  onUpdated?: LifecycleHook;
  onBeforeUnmount?: LifecycleHook;
  onUnmounted?: LifecycleHook;
  onErrorCaptured?: (err: Error, instance: Component | null, info: string) => boolean | void;
}

// === 模板引用类型 ===
export type TemplateRef<T = HTMLElement> = Ref<T | null>;

export interface ComponentRef<T = Component> extends Ref<T | null> {
  value: T | null;
}

// === 响应式类型 ===
export type ReactiveData<T> = UnwrapRef<T>;

export interface ReactiveOptions {
  deep?: boolean;
  flush?: 'pre' | 'post' | 'sync';
  onTrack?: (event: any) => void;
  onTrigger?: (event: any) => void;
}

// === 计算属性类型 ===
export interface ComputedOptions<T> {
  get(): T;
  set?(value: T): void;
}

export type ComputedGetter<T> = () => T;
export type ComputedSetter<T> = (value: T) => void;

// === 监听器类型 ===
export interface WatchOptions {
  immediate?: boolean;
  deep?: boolean;
  flush?: 'pre' | 'post' | 'sync';
  onTrack?: (event: any) => void;
  onTrigger?: (event: any) => void;
}

export type WatchCallback<T, OldT = T> = (value: T, oldValue: OldT) => void;

export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T);

// === 异步组件类型 ===
export interface AsyncComponentOptions {
  loader: () => Promise<Component>;
  loadingComponent?: Component;
  errorComponent?: Component;
  delay?: number;
  timeout?: number;
  suspensible?: boolean;
  onError?: (error: Error, retry: () => void, fail: () => void, attempts: number) => any;
}

// === Teleport类型 ===
export interface TeleportProps {
  to: string | HTMLElement;
  disabled?: boolean;
}

// === Suspense类型 ===
export interface SuspenseProps {
  timeout?: string | number;
}

// === 全局属性类型 ===
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $router: Router;
    $route: RouteLocationNormalizedLoaded;
  }
}

// === Vue 3.5特定类型 ===
export interface UseIdOptions {
  prefix?: string;
}

export interface UseTemplateRefOptions {
  flush?: 'pre' | 'post' | 'sync';
}

// === 响应式Props类型 (Vue 3.5新特性) ===
export type ReactiveProps<T> = {
  readonly [K in keyof T]: Ref<T[K]>;
};

// === 服务端渲染类型 ===
export interface SSRContext {
  request?: any;
  url?: string;
  teleports?: Record<string, string>;
  [key: string]: any;
}

// === 开发工具类型 ===
export interface DevtoolsPluginApi {
  addTimelineLayer(options: any): void;
  addInspector(options: any): void;
  on(eventType: string, handler: Function): void;
  notifyComponentUpdate(instance?: Component): void;
}