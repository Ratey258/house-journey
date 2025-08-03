/**
 * 统一类型定义索引
 * 整合项目中所有的TypeScript接口和类型定义
 */

// ==================== 核心领域类型 ====================
export * from '../core/interfaces/entities';
export * from '../core/interfaces/repositories';
export * from '../core/interfaces/services';

// ==================== 应用层类型 ====================
export * from '../application/interfaces/services';

// ==================== 基础设施层类型 ====================
export * from '../infrastructure/interfaces/services';

// ==================== UI层类型 ====================
export * from '../ui/interfaces/components';

// ==================== 全局类型定义 ====================

/**
 * 通用操作结果接口
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: Date;
}

/**
 * 分页结果接口
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * 查询参数接口
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  search?: string;
}

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

/**
 * API错误接口
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * 响应元数据接口
 */
export interface ResponseMetadata {
  timestamp: Date;
  requestId: string;
  version: string;
  processingTime?: number;
}

// ==================== 实用类型定义 ====================

/**
 * 深度只读类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 深度可选类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 选择性必需类型
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 选择性可选类型
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 提取函数参数类型
 */
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

/**
 * 提取函数返回类型
 */
export type ReturnType<F extends Function> = F extends (...args: any[]) => infer R ? R : never;

/**
 * 提取Promise解析类型
 */
export type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never;

/**
 * 联合类型转交集类型
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * 字符串字面量类型
 */
export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;

/**
 * 数字字面量类型
 */
export type NumberLiteral<T> = T extends number ? (number extends T ? never : T) : never;

// ==================== 条件类型定义 ====================

/**
 * 检查类型是否为空
 */
export type IsEmpty<T> = T extends null | undefined | '' | [] | {} ? true : false;

/**
 * 检查类型是否为数组
 */
export type IsArray<T> = T extends any[] ? true : false;

/**
 * 检查类型是否为函数
 */
export type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

/**
 * 检查类型是否为对象
 */
export type IsObject<T> = T extends object ? (T extends any[] ? false : true) : false;

// ==================== 映射类型定义 ====================

/**
 * 字段类型映射
 */
export type FieldTypeMap<T> = {
  [K in keyof T]: T[K] extends string ? 'string' :
                  T[K] extends number ? 'number' :
                  T[K] extends boolean ? 'boolean' :
                  T[K] extends Date ? 'date' :
                  T[K] extends any[] ? 'array' :
                  T[K] extends object ? 'object' :
                  'unknown';
};

/**
 * 可序列化类型
 */
export type Serializable<T> = T extends string | number | boolean | null | undefined
  ? T
  : T extends any[]
  ? SerializableArray<T[number]>
  : T extends object
  ? SerializableObject<T>
  : never;

type SerializableArray<T> = Serializable<T>[];

type SerializableObject<T> = {
  [K in keyof T]: Serializable<T[K]>;
};

// ==================== 品牌类型定义 ====================

/**
 * 品牌类型基础
 */
declare const __brand: unique symbol;
type Brand<T, TBrand> = T & { [__brand]: TBrand };

/**
 * 实体ID类型
 */
export type EntityId = Brand<string, 'EntityId'>;
export type PlayerId = Brand<string, 'PlayerId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type LocationId = Brand<string, 'LocationId'>;
export type CategoryId = Brand<string, 'CategoryId'>;

/**
 * 价格类型
 */
export type Price = Brand<number, 'Price'>;
export type Money = Brand<number, 'Money'>;
export type Percentage = Brand<number, 'Percentage'>;

/**
 * 时间类型
 */
export type Timestamp = Brand<number, 'Timestamp'>;
export type WeekNumber = Brand<number, 'WeekNumber'>;

// ==================== 环境和配置类型 ====================

/**
 * 环境类型
 */
export type Environment = 'development' | 'testing' | 'staging' | 'production';

/**
 * 构建模式类型
 */
export type BuildMode = 'spa' | 'ssr' | 'ssg' | 'electron';

/**
 * 日志级别类型
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/**
 * 主题模式类型
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * 语言代码类型
 */
export type LanguageCode = 'zh-CN' | 'zh-TW' | 'en-US' | 'en-GB' | 'ja-JP' | 'ko-KR';

// ==================== 游戏特定类型 ====================

/**
 * 游戏阶段类型
 */
export type GamePhase = 'loading' | 'menu' | 'playing' | 'paused' | 'ended' | 'victory' | 'defeat';

/**
 * 难度等级类型
 */
export type DifficultyLevel = 'tutorial' | 'easy' | 'normal' | 'hard' | 'nightmare' | 'custom';

/**
 * 游戏模式类型
 */
export type GameMode = 'campaign' | 'freeplay' | 'challenge' | 'tutorial' | 'endless';

/**
 * 价格趋势类型
 */
export type PriceTrend = 'rising_strong' | 'rising' | 'stable_high' | 'stable' | 'stable_low' | 'falling' | 'falling_strong' | 'volatile';

/**
 * 市场情绪类型
 */
export type MarketSentiment = 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';

/**
 * 事件类型
 */
export type EventType = 'market' | 'weather' | 'political' | 'economic' | 'social' | 'random' | 'special';

/**
 * 成就类别类型
 */
export type AchievementCategory = 'trading' | 'exploration' | 'wealth' | 'time' | 'special' | 'social' | 'collection';

// ==================== 组件和UI类型 ====================

/**
 * 组件尺寸类型
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 组件变体类型
 */
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * 加载状态类型
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * 数据状态类型
 */
export type DataState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
};

/**
 * 异步状态类型
 */
export type AsyncState<T, E = string> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

// ==================== 事件和回调类型 ====================

/**
 * 事件回调类型
 */
export type EventCallback<T = any> = (data: T) => void | Promise<void>;

/**
 * 错误回调类型
 */
export type ErrorCallback = (error: Error) => void;

/**
 * 成功回调类型
 */
export type SuccessCallback<T = any> = (data: T) => void;

/**
 * 取消函数类型
 */
export type CancelFunction = () => void;

/**
 * 清理函数类型
 */
export type CleanupFunction = () => void;

// ==================== 验证和约束类型 ====================

/**
 * 验证规则类型
 */
export type ValidationRule<T = any> = {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
};

/**
 * 验证结果类型
 */
export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

/**
 * 约束类型
 */
export type Constraint<T> = (value: T) => boolean;

// ==================== 导出工具类型 ====================

/**
 * 提取对象值类型
 */
export type ValueOf<T> = T[keyof T];

/**
 * 提取对象键类型
 */
export type KeyOf<T> = keyof T;

/**
 * 非空类型
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 可空类型
 */
export type Nullable<T> = T | null;

/**
 * 可选类型
 */
export type Optional<T> = T | undefined;

/**
 * 字符串键类型
 */
export type StringKeys<T> = Extract<keyof T, string>;

/**
 * 数字键类型
 */
export type NumberKeys<T> = Extract<keyof T, number>;

/**
 * 符号键类型
 */
export type SymbolKeys<T> = Extract<keyof T, symbol>;