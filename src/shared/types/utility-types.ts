/**
 * 工具类型定义
 * 提供通用的TypeScript工具类型
 */

// === 基础工具类型 ===

/**
 * 深度可选类型 - 递归将所有属性设为可选
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 深度必需类型 - 递归将所有属性设为必需
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * 深度只读类型 - 递归将所有属性设为只读
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 可为空类型
 */
export type Nullable<T> = T | null;

/**
 * 可为undefined类型
 */
export type Optional<T> = T | undefined;

/**
 * 可为空或undefined类型
 */
export type Maybe<T> = T | null | undefined;

// === 键值操作类型 ===

/**
 * 获取对象的键类型
 */
export type Keys<T> = keyof T;

/**
 * 获取对象的值类型
 */
export type Values<T> = T[keyof T];

/**
 * 根据值类型获取键
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * 提取特定类型的属性
 */
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

/**
 * 排除特定类型的属性
 */
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

// === 条件类型 ===

/**
 * 如果T是数组类型，返回元素类型，否则返回T
 */
export type Unpacked<T> = T extends (infer U)[] ? U : T;

/**
 * 提取Promise的返回类型
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : T;

/**
 * 提取函数的返回类型
 */
export type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

/**
 * 提取函数的参数类型
 */
export type ParametersOf<T> = T extends (...args: infer P) => any ? P : never;

// === 字符串操作类型 ===

/**
 * 首字母大写
 */
export type Capitalize<S extends string> = S extends `${infer T}${infer U}` 
  ? `${Uppercase<T>}${U}` 
  : S;

/**
 * 首字母小写
 */
export type Uncapitalize<S extends string> = S extends `${infer T}${infer U}` 
  ? `${Lowercase<T>}${U}` 
  : S;

/**
 * 驼峰转下划线
 */
export type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnake<U>}`
  : S;

/**
 * 下划线转驼峰
 */
export type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

// === 数组操作类型 ===

/**
 * 数组的第一个元素类型
 */
export type Head<T extends readonly any[]> = T extends readonly [infer H, ...any[]] ? H : never;

/**
 * 数组除第一个元素外的类型
 */
export type Tail<T extends readonly any[]> = T extends readonly [any, ...infer R] ? R : [];

/**
 * 数组的长度
 */
export type Length<T extends readonly any[]> = T['length'];

/**
 * 元组转联合类型
 */
export type TupleToUnion<T extends readonly any[]> = T[number];

// === 对象操作类型 ===

/**
 * 重命名对象的键
 */
export type RenameKeys<T, M extends Record<keyof T, string>> = {
  [K in keyof T as K extends keyof M ? M[K] : K]: T[K];
};

/**
 * 将对象的值类型转换为另一种类型
 */
export type MapValues<T, U> = {
  [K in keyof T]: U;
};

/**
 * 过滤对象属性
 */
export type Filter<T, U> = Pick<T, {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T]>;

/**
 * 对象路径类型
 */
export type Path<T> = T extends object ? {
  [K in keyof T]: K extends string | number ? 
    `${K}` | `${K}.${Path<T[K]>}` : never;
}[keyof T] : never;

/**
 * 根据路径获取值类型
 */
export type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T 
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

// === 函数类型工具 ===

/**
 * 异步函数类型
 */
export type AsyncFunction<T extends any[] = any[], R = any> = (...args: T) => Promise<R>;

/**
 * 事件处理函数类型
 */
export type EventHandler<T = Event> = (event: T) => void;

/**
 * 回调函数类型
 */
export type Callback<T = void> = () => T;

/**
 * 带参数的回调函数类型
 */
export type CallbackWithArgs<T extends any[] = any[], R = void> = (...args: T) => R;

// === 品牌类型 ===

/**
 * 品牌类型 - 用于创建名义类型
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * ID品牌类型
 */
export type UserId = Brand<string, 'UserId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type HouseId = Brand<string, 'HouseId'>;
export type TradeId = Brand<string, 'TradeId'>;

// === 状态机类型 ===

/**
 * 状态机状态类型
 */
export type StateMachine<S extends string, E extends string> = {
  state: S;
  transitions: Record<S, Partial<Record<E, S>>>;
};

/**
 * 状态转换类型
 */
export type StateTransition<T extends StateMachine<any, any>> = {
  from: T['state'];
  event: string;
  to: T['state'];
};

// === 验证类型 ===

/**
 * 验证结果类型
 */
export type ValidationResult<T = any> = {
  valid: boolean;
  errors: ValidationError[];
  data?: T;
};

/**
 * 验证错误类型
 */
export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

// === 配置类型 ===

/**
 * 配置选项类型
 */
export type ConfigOptions<T> = DeepPartial<T> & {
  [K in keyof T]?: T[K] extends object ? ConfigOptions<T[K]> : T[K];
};

// === 通用工厂类型 ===

/**
 * 工厂函数类型
 */
export type Factory<T, P extends any[] = []> = (...params: P) => T;

/**
 * 构造函数类型
 */
export type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * 抽象构造函数类型
 */
export type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T;