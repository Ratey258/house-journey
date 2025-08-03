/**
 * 共享类型定义 - FSD架构
 * 通用类型定义，供整个应用使用
 */

// === 基础类型 ===
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// === API相关类型 ===
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// === 通用状态类型 ===
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}

// === 数值类型 ===
export interface Price {
  amount: number;
  currency: string;
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

// === 时间相关类型 ===
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface GameTime {
  week: number;
  year: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

// === UI相关类型 ===
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  handler: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

// === 表单相关类型 ===
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox';
  value: any;
  rules?: ValidationRule[];
  options?: SelectOption[];
}

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

// === 事件类型 ===
export interface GameEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  data?: Record<string, any>;
}

// === 工具类型 ===
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// === 函数类型 ===
export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;
export type Predicate<T> = (item: T) => boolean;
export type Comparator<T> = (a: T, b: T) => number;

// === 配置类型 ===
export interface Config {
  [key: string]: any;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  conditions?: Record<string, any>;
}

// === 权限类型 ===
export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  name: string;
  permissions: Permission[];
}

// === 桌面端特定类型 ===
export interface DesktopConfig {
  windowSize: Dimensions;
  position: Coordinates;
  maximized: boolean;
  fullscreen: boolean;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  memory: number;
}

// === 游戏特定类型 ===
export interface GameConfig {
  difficulty: 'easy' | 'normal' | 'hard';
  autoSave: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  language: string;
}

export interface SaveData {
  id: string;
  name: string;
  createdAt: Date;
  gameTime: GameTime;
  playerData: any;
  worldState: any;
}

// 导出所有类型
export * from './api';
export * from './common';
export * from './entities';
export * from './utility-types';
export * from './vue-types';